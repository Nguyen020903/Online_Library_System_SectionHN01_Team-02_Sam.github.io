const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { getUserById, getBookById } = require('./middleware/nameMiddleware');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const Agenda = require('agenda');

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(cookieParser());

// Import model
const User = require('./models/user');
const Book = require('./models/book');
const Author = require('./models/author');
const Category = require('./models/category');
const Publisher = require('./models/publisher');
const Transaction = require('./models/transaction');
const Review = require('./models/review');

const {
    requireAuth,
    checkUser,
} = require('./middleware/authMiddleware');
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('*', checkUser);

// Check if User is Librarian
const isAdmin = async (req, res, next) => {
  if (res.locals.user && res.locals.user.isAdmin) {
      next(); // User is authenticated and is an admin, continue to the next middleware or route handler
  } else {
      res.status(403).send('You do not have permission to enter this page');
  }
};

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      maxAge: 60 * 60 * 24 * 24 * 7,
      secure: false 
    },
  })
);
app.use(authRoutes);
app.use(bookRoutes);
app.use(reservationRoutes);
app.use(reviewRoutes);



// Database Connection
const mongoURI = 'mongodb+srv://hmyle:ingsqEe3t4CevFzo@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.log(error.message));


let selectedBook;
let selectedDate;

// implement the book of the day feature to random one book per day
app.get('/', checkUser, async (req,res) => {
  try {
    const authors = await Author.find();
    const categories = await Category.find();
    const publishers = await Publisher.find();
    let books = await Book.find().populate('author').populate('category').populate('publisher');
    const count = await Book.countDocuments();

    const currentDate = new Date().toISOString().slice(0,10); // get the current date in YYYY-MM-DD format

    if (!selectedBook || selectedDate !== currentDate) {
      const random = Math.floor(Math.random() * count);
      selectedBook = await Book.findOne().skip(random);
      selectedDate = currentDate;
    }

    // Get Library Review
    const reviews = await Review.find().limit(5);
    
    const reviewsWithUser = await Promise.all(reviews.map(async (review) => {
        const user = await User.findById(review.userId);
        return {
            ...review._doc,
            reviewedUser: user
        };
    }));

    res.render('index', { books, authors, categories, publishers, bookoftheday: selectedBook, reviews: reviewsWithUser });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// My Account page
app.get('/myAccount', requireAuth, async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const authors = await Author.find();
    const publishers = await Publisher.find();
    if (token) {
      jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
        if (err) {
          console.log(err.message);
        } else {
          let user = await User.findById(decodedToken.id);
          if (user) {
            let books = [];
            // Find the user's favorite books
            books = await Book.find({ _id: { $in: user.favoriteBook } })
              .populate('author') // populate author details
              .populate('category') // populate category details
              .exec();

            const userDetails = await User.findById(decodedToken.id).populate('activeTransactions').populate('prevTransactions').exec();
            if (!userDetails) {
              console.error('User not found:', userDetails._id);
              return res.status(404).json({ success: false, message: 'User not found' });
            }
            const transactions = await Transaction.find();

            await Promise.all(transactions.map(async (transaction) => {
              if ((transaction.returnDate < Date.now() && transaction.status == 'Reserved') || (transaction.returnDate < Date.now() && transaction.status == 'Overdue')) {
                await Transaction.findByIdAndUpdate(
                  transaction._id,
                  {
                    $set: {
                      status: 'Overdue',
                      fine: 1000 * Math.floor((Date.now() - new Date(transaction.returnDate)) / (1000 * 60 * 60 * 24))
                    }
                  },
                  { new: true },
                );
              }
            }));

            const allActiveTransactions = await Promise.all(
              userDetails.activeTransactions.map(async (transaction) => {
                if (!transaction) {
                  console.error('Transaction not found');
                  return;
                }

                const book = await getBookById(transaction.bookId);
                return {
                  bookTitle: book.title,
                  status: transaction.status,
                  pickUpDate: transaction.pickUpDate,
                  returnDate: transaction.returnDate,
                  fine: transaction.fine,
                };
              })
            );

            const allPrevTransactions = await Promise.all(
              userDetails.prevTransactions.map(async (transaction) => {
                if (!transaction) {
                  console.error('Transaction not found');
                  return;
                }

                const book = await getBookById(transaction.bookId);
                return {
                  bookTitle: book.title,
                  status: transaction.status,
                  pickUpDate: transaction.pickUpDate,
                  returnDate: transaction.returnDate,
                  fine: transaction.fine,
                };
              })
            );

            // Fetch user and book details for each transaction
            const transactionsWithDetails = await Promise.all(
              transactions.map(async (transaction) => {
                // Get user name and book title
                const user = await User.findById(transaction.userId).exec();
                const book = await Book.findById(transaction.bookId).exec();
            
                const userEmail = user ? user.email : 'User not found';
                const bookTitle = book ? book.title : 'Book not found';

                // Return book with user and book name
                return {
                  _id: transaction._id,
                  userEmail: userEmail,
                  bookTitle: bookTitle,
                  status: transaction.status,
                  pickUpDate: transaction.pickUpDate,
                  returnDate: transaction.returnDate,
                  fine: transaction.fine,
                };
              })
            );

            res.render('myAccount', { user: user, books: books, allActiveTransactions, allPrevTransactions, transactions: transactionsWithDetails, authors: authors, publishers: publishers });
          }
        }
      });
    } else {
      res.locals.user = null;
      next();
    }
  } catch (error) {
    console.error('Error processing transactions:', error);
    res.status(500).send('Internal Server Error');
  }
});

// this one is remove from wishlist function for myAccount page
app.post('/removeFromWishlist/:bookId', requireAuth, async (req, res) => {
  const bookId = req.params.bookId;
  const token = req.cookies.jwt;
  const decodedToken = jwt.verify(token, 'your-secret-key');
  const userId = decodedToken.id; // Assuming you have access to the user's ID

  try {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Remove the book from the user's favoriteBook
      user.favoriteBook = user.favoriteBook.filter(book => book.toString() !== bookId);

      // Save the user
      await user.save();

      // Redirect back to the myAccount page
      res.redirect('/myAccount');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// delete all wishlist book of that user
app.post('/clearFavoriteBooks', requireAuth, async (req, res) => {
  const token = req.cookies.jwt;
  const decodedToken = jwt.verify(token, 'your-secret-key');
  const userId = decodedToken.id; // Assuming you have access to the user's ID

  try {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Clear the user's favoriteBook array
      user.favoriteBook = [];

      // Save the user
      await user.save();

      // Redirect back to the myAccount page
      res.redirect('/myAccount');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/updateUser', requireAuth, (req, res) => {
  res.render('updateUser');
});

// function for save user image
const userImgStorage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'public/images/userImage/');
  },
  filename: function(req, file, cb) { // 'file' and 'cb' parameters were swapped
      const token = req.cookies.jwt;
      const decodedToken = jwt.verify(token, 'your-secret-key');
      const userId = decodedToken.id;
      // Get the current date
      const date = new Date();
      // Format the date
      const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
      // Add the date to the filename
      const newFilename = `${formattedDate}-${userId}-${file.originalname}`;
      cb(null, newFilename);
  }
});

const userImgUpload = multer({ storage: userImgStorage });


// Route for uploading the profile image
app.post('/updateUserImage', userImgUpload.single('profileImage'), async (req, res) => {
  const token = req.cookies.jwt;

  try {
      // Verify the token and extract the user ID
      const decodedToken = jwt.verify(token, 'your-secret-key');
      const userId = decodedToken.id;

      // Get the user from the database
      const user = await User.findById(userId);

      // If the user has an old image, delete it
      // if (user.profileImage) {
      //     fs.unlink(path.join(__dirname, 'public', user.profileImage), err => {
      //         if (err) console.error(err);
      //     });
      // }
      if (user.profileImage && user.profileImage !== 'https://i.ibb.co/K05xQk1/book7.png') {
            fs.unlink(path.join(__dirname, 'public', user.profileImage), err => {
                if (err) console.error(err);
            });
        }

      // Extract the filename from the uploaded file
      const profileImage = "/images/userImage/" + (req.file ? req.file.filename : '');

      const updatedUser = await User.findOneAndUpdate(
          { _id: userId }, // find a user with the provided user ID
          { profileImage }, // update the user with the new image
          { new: true } // return the updated user
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Send a response indicating that the update was successful
      res.json({ message: 'Image update successful' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the user image' });
  }
});

// Route for updating the user's details
app.post('/updateUserDetails', checkUser, requireAuth, async (req, res) => {
  const token = req.cookies.jwt;
  const { fullName, email, password } = req.body;

  try {
      // Verify the token and extract the user ID
      const decodedToken = jwt.verify(token, 'your-secret-key');
      const userId = decodedToken.id;

      // Salt and hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const updatedUser = await User.findOneAndUpdate(
          { _id: userId }, // find a user with the provided user ID
          { fullName, email, password: hashedPassword }, // update the user with the new data
          { new: true } // return the updated user
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Send a response indicating that the update was successful
      res.json({ message: 'Details update successful' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the user details' });
  }
});


//function for save book image
const bookImageStorage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'public/images/bookImage/');
  },
  filename: function(req, file, cb) { // 'file' and 'cb' parameters were swapped
      const token = req.cookies.jwt;
      const decodedToken = jwt.verify(token, 'your-secret-key');
      const userId = decodedToken.id;
      // Get the current date
      const date = new Date();
      // Format the date
      const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
      // Add the date to the filename
      const newFilename = `${formattedDate}-${userId}-${file.originalname}`;
      cb(null, newFilename);
  }
});

const bookImageUpload = multer({ storage: bookImageStorage });

const handleErrorsforaddbook = (err) => {
  console.log(err.message, err.code);
  let errors = { Name: '' };

  // Duplicate Error Code for similar name
  if (err.code == 11000) {
      errors.ISBN = 'This ISBN has been registered';
      return errors;
  }

  // check for type of error
  if (err.message.includes('author validation failed')) {
      Object.values(err.errors).forEach(({ properties }) => {
          errors[properties.path] = properties.message;
      });
  }
  if (err.message.includes('category validation failed')) {
      Object.values(err.errors).forEach(({ properties }) => {
          errors[properties.path] = properties.message;
      });
  }
  if (err.message.includes('publisher validation failed')) {
      Object.values(err.errors).forEach(({ properties }) => {
          errors[properties.path] = properties.message;
      });
  }
  if (err.message.includes('Book validation failed')) {
      Object.values(err.errors).forEach(({ properties }) => {
          errors[properties.path] = properties.message;
      });
  }

  return errors;
};

app.post('/addbook', (req, res, next) => {
  console.log('Request Body:', req.body);
  console.log('Request File:', req.file);
  next();
}, checkUser, isAdmin, multer({ storage: bookImageStorage }).single('bookImage'), async (req, res) => {  
  try {
    const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
    let bookData = { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description };

    if (req.file) {
      bookData.bookImage = "/images/bookImage/" + req.file.filename;
    }

    const book = await Book.create(bookData);
    const updatedAuthor = await Author.findOneAndUpdate({ _id: author }, { $push: { book: book._id } }, { new: true });
    const updatedCategory = await Category.findOneAndUpdate({ _id: category }, { $push: { book: book._id } }, { new: true });
    const updatedPublisher = await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: book._id } }, { new: true });
    res.status(200).json({book, updatedAuthor, updatedCategory, updatedPublisher});
  }
  catch (err) {
    let error = handleErrorsforaddbook(err);
    res.status(400).json({ error });
  }
});

// Route for displaying book details
app.get('/bookDetail/:id', requireAuth, async (req, res) => {
  // console.log('Book detail route called with id:', req.params.id);
  // console.log('Request headers:', req.headers);
  try {
    const authors = await Author.find();
    const categories = await Category.find();
    const publishers = await Publisher.find();
    const book = await Book.findById(req.params.id).populate('author').populate('category').populate('publisher');
    res.render('bookDetail', { book: book, authors: authors, categories: categories, publishers: publishers });
  } catch (err) {
      console.error(err);
      res.redirect('/');
  }
});

// Route for displaying the book update form
app.get('/updateBook/:id', async (req, res) => {
  try {
      const book = await Book.findById(req.params.id);
      const authors = await Author.find();
      const categories = await Category.find();
      const publishers = await Publisher.find();
      res.render('updateBook', { book: book, authors: authors, categories: categories, publishers: publishers });
  } catch (err) {
      console.error(err);
      res.redirect('/');
  }
});

app.post('/updateBook/:id', requireAuth,bookImageUpload.single('bookImage'), async (req, res) => {
  const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
  try{
    const book = await Book.findById(req.params.id);
    if (book.bookImage) {
      fs.unlink(path.join(__dirname, 'public', book.bookImage), err => {
          if (err) console.error(err);
      });
    }
    const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ISBN, title, bookImage, author, category, publisher, numberOfPages, bookCountAvailable, description }, { new: true });
    // Update the author, category, and publisher if provided
    if (author) {
      // Remove the book from the old author
      await Author.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
      await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
  }

  if (category) {
      // Remove the book from the old category
      await Category.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
      await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
  }

  if (publisher) {
      // Remove the book from the old publisher
      await Publisher.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
      await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
  }

    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book update successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the book' });
  }
});

app.post('/updateBookDetail/:id', requireAuth, async (req, res) => {
  console.log(req.body)
  const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description }, { new: true });

    // Update the author, category, and publisher if provided
    if (author) {
      await Author.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
      await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
    }

    if (category) {
      await Category.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
      await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
    }

    if (publisher) {
      await Publisher.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
      await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
    }

    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book update successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the book' });
  }
});

app.post('/updateBookImage/:id', requireAuth, bookImageUpload.single('bookImage'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book.bookImage) {
      fs.unlink(path.join(__dirname, 'public', book.bookImage), err => {
        if (err) console.error(err);
      });
    }
    const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, { bookImage }, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book image update successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the book image' });
  }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});