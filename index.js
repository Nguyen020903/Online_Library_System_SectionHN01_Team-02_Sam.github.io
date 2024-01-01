const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
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



// Database Connection
const mongoURI = 'mongodb+srv://hmyle:ingsqEe3t4CevFzo@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.log(error.message));

const agenda = new Agenda({ db: { address: mongoURI, collection: 'agendaJobs' } });

// Check book reservation
// agenda.define('deleteInactiveUsers', async (job) => {
//   try {
//     // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

//     const timePeriod = new Date(Date.now() - 60 * 1000);

//     // Find users whose updatedAt is older than seven days
//     // const overdueReservation = await 


//     const inactiveUsers = await User.find({ updatedAt: { $lt: sevenDaysAgo } });

//     // Delete each inactive user
//     await Promise.all(inactiveUsers.map((user) => user.remove()));

//     console.log(`Deleted ${inactiveUsers.length} inactive users`);
//   } catch (error) {
//     console.error('Error deleting inactive users:', error);
//   }
// });

// (async () => {
//   await agenda.start();

//   // Schedule the job to run every day
//   await agenda.every('24 hours', 'deleteInactiveUsers');
// })();

app.get('/', checkUser, async (req,res) => {
  try {
  const authors = await Author.find();
  const categories = await Category.find();
  const publishers = await Publisher.find();
  let books = await Book.find().populate('author').populate('category').populate('publisher');
  const count = await Book.countDocuments();
  const random = Math.floor(Math.random() * count);
  const book = await Book.findOne().skip(random);
  res.render('index', { books, authors, categories, publishers, bookoftheday: book });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// app.get('/', async (req, res) => {
//   try {
//     const bookId = '6592ed261e94d99c8d7937ba'; // replace with your specific book id
//     const book = await Book.findById(bookId);
//     res.render('index', { book: book });
//   } catch (err) {
//     console.error(err);
//     res.redirect('/');
//   }
// });

// My Account page
app.get('/myAccount', requireAuth, async (req, res) => {
    const token = req.cookies.jwt;

    if (token) {
      jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
        if (err) {
          console.log(err.message);
        } else {
          let user = await User.findById(decodedToken.id);
          if (User) {
            res.render('myAccount', { user: user });
        }
        }});
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
      if (user.profileImage && user.profileImage !== 'https://drive.google.com/uc?id=1j9oMUsNA88sQYIgwRpD2FPBKZXlbYUyF') {
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
  console.log(req.params.id); // Log the id
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

// Route for updating book details
app.post('/bookDetail/:id', async (req, res) => {
  // console.log(req.params.id); // Log the id
  try {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.redirect(`/bookDetail/${updatedBook._id}`);
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

// app.post('/updateBook/:id', requireAuth,bookImageUpload.single('bookImage'), async (req, res) => {
//   const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
//   try{
//     const book = await Book.findById(req.params.id);
//     if (book.bookImage) {
//       fs.unlink(path.join(__dirname, 'public', book.bookImage), err => {
//           if (err) console.error(err);
//       });
//     }
//     const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');

//     const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ISBN, title, bookImage, author, category, publisher, numberOfPages, bookCountAvailable, description }, { new: true });
//     // Update the author, category, and publisher if provided
//     if (author) {
//       // Remove the book from the old author
//       await Author.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
//       await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
//   }

//   if (category) {
//       // Remove the book from the old category
//       await Category.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
//       await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
//   }

//   if (publisher) {
//       // Remove the book from the old publisher
//       await Publisher.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
//       await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
//   }

//     if (!updatedBook) {
//       return res.status(404).json({ message: 'Book not found' });
//     }
//     res.json({ message: 'Book update successful' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'An error occurred while updating the book' });
//   }
// });

app.post('/updateBookDetail/:id', requireAuth, async (req, res) => {
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