// Importing required modules
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const Agenda = require('agenda');

// Importing routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Importing middleware
const { getUserById, getBookById } = require('./middleware/nameMiddleware');
const { requireAuth, checkUser, isAdmin } = require('./middleware/authMiddleware');

// Importing models
const User = require('./models/user');
const Book = require('./models/book');
const Author = require('./models/author');
const Category = require('./models/category');
const Publisher = require('./models/publisher');
const Transaction = require('./models/transaction');
const Review = require('./models/review');

// Initializing express app
const app = express();
const port = 3000;

// Setting up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Checking user for all routes
app.get('*', checkUser);

// Setting up session
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

// Setting up routes
app.use(authRoutes);
app.use(bookRoutes);
app.use(reservationRoutes);
app.use(reviewRoutes);

// Database Connection
const mongoURI = 'mongodb+srv://hmyle:ingsqEe3t4CevFzo@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.log(error.message));

// Variables for book of the day feature
let selectedBook;
let selectedDate;

// Middleware for image upload
const userImgStorage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'public/images/userImage/');
  },
  filename: function(req, file, cb) {
      const token = req.cookies.jwt;
      const decodedToken = jwt.verify(token, 'your-secret-key');
      const userId = decodedToken.id;
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
      const newFilename = `${formattedDate}-${userId}-${file.originalname}`;
      cb(null, newFilename);
  }
});

const userImgUpload = multer({ storage: userImgStorage });


// ---------------------------------------------------------------------------------------- //

app.get('/dashboard', checkUser, isAdmin, async (req, res) => {
  const bookCount = await Book.countDocuments();

  const activeTransactionCount = await Transaction.countDocuments({ status: { $nin: ['Returned', 'Pending'] } });

  const pendingTransactionCount = await Transaction.countDocuments({ status: 'Pending' });

  const userCount = await User.countDocuments();

  // Calculate the number of transactions for each month
const transactionsByMonth = await Transaction.aggregate([
  {
    $group: {
      _id: { $month: "$createdAt" },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);

// Initialize an array to hold the counts for each month
const monthCounts = new Array(12).fill(0);

// Fill the monthCounts array with the counts from transactionsByMonth
transactionsByMonth.forEach(transaction => {
  // MongoDB's $month operator returns months in the range 1-12, 
  // but JavaScript's array indices are in the range 0-11, so we subtract 1
  const monthIndex = transaction._id - 1;

  // Set the count for this month in the monthCounts array
  monthCounts[monthIndex] = transaction.count;
});

  console.log(monthCounts);

  const overdueTransactions = await Transaction.find({ status: 'Overdue' });

  const allOverdueTransactions = await Promise.all(
    overdueTransactions.map(async (transaction) => {
      const book = await getBookById(transaction.bookId);
      const user = await getUserById(transaction.userId);
      return {
        userName: user.fullName,
        bookTitle: book.title,
        dayOverdue: Math.floor((Date.now() - new Date(transaction.returnDate)) / (1000 * 60 * 60 * 24)),
      };
    })
  );

  res.render('dashboard', { allOverdueTransactions, bookCount, activeTransactionCount, pendingTransactionCount, userCount, monthCounts });
});


// Route for all types of users
app.get('/', checkUser, async (req,res) => {
  try {
    // Fetch all authors, categories, and publishers from the database
    const authors = await Author.find();
    const categories = await Category.find();
    const publishers = await Publisher.find();
  
    // Fetch all books and populate their author, category, and publisher fields
    let books = await Book.find().populate('author').populate('category').populate('publisher');
  
    // Get the total count of books
    const count = await Book.countDocuments();
  
    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().slice(0,10);
  
    // If there is no selected book or the selected date is not the current date
    if (!selectedBook || selectedDate !== currentDate) {
      // Generate a random number within the range of the total book count
      const random = Math.floor(Math.random() * count);
  
      // Select a random book and set it as the selected book
      selectedBook = await Book.findOne().skip(random);
  
      // Set the selected date as the current date
      selectedDate = currentDate;
    }
  
    // Fetch the latest 5 reviews
    const reviews = await Review.find().limit(5);
  
    // Map over the reviews to fetch the user who made each review
    const reviewsWithUser = await Promise.all(reviews.map(async (review) => {
      const user = await User.findById(review.userId);
      return {
        ...review._doc,
        reviewedUser: user
      };
    }));
  
    // Render the index page with the fetched data
    res.render('index', { books, authors, categories, publishers, bookoftheday: selectedBook, reviews: reviewsWithUser });
  
  } catch (err) {
    // Log any error that occurs and redirect to the home page
    console.error(err);
    res.redirect('/');
  }
});


// ---------------------------------------------------------------------------------------- //

// Information page
app.get('/information', (req, res) => {
  res.render('information');
});

// My Account page
app.get('/myAccount', requireAuth, checkUser, async (req, res) => {
  try {
    // Get the user from res.locals
    let user = res.locals.user;
  
    // If the user is not defined, set it to null and proceed to the next middleware
    if (!user) {
      res.locals.user = null;
      next();
      return;
    }
  
    // Fetch all authors and publishers from the database
    const authors = await Author.find();
    const publishers = await Publisher.find();
  
    // Fetch the user's favorite books and populate their author and category details
    let books = await Book.find({ _id: { $in: user.favoriteBook } })
      .populate('author')
      .populate('category')
      .exec();
  
    // Fetch the user's details and populate their active and previous transactions
    const userDetails = await User.findById(user._id)
      .populate('activeTransactions')
      .populate('prevTransactions')
      .exec();
  
    // If the user details are not found, return a 404 error
    if (!userDetails) {
      console.error('User not found:', userDetails._id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  
    // Fetch all transactions
    const transactions = await Transaction.find();
  
    // Update the status and fine of overdue transactions
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
  
    // Fetch the book details for each of the user's active transactions
    const allActiveTransactions = await Promise.all(
      userDetails.activeTransactions.map(async (transaction) => {
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
  
    // Fetch the book details for each of the user's previous transactions
    const allPrevTransactions = await Promise.all(
      userDetails.prevTransactions.map(async (transaction) => {
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
  
    // Fetch the user and book details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await User.findById(transaction.userId).exec();
        const book = await Book.findById(transaction.bookId).exec();
  
        const userEmail = user ? user.email : 'User not found';
        const bookTitle = book ? book.title : 'Book not found';
  
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
  
    // Render the 'myAccount' page with the fetched data
    res.render('myAccount', { user: user, books: books, allActiveTransactions, allPrevTransactions, transactions: transactionsWithDetails, authors: authors, publishers: publishers });
  
  } catch (error) {
    // Log any error that occurs and return a 500 error
    console.error('Error processing transactions:', error);
    res.status(500).send('Internal Server Error');
  }
});


// ---------------------------------------------------------------------------------------- //

// Route for updating user details
app.get('/updateUser', requireAuth, (req, res) => {
  res.render('updateUser');
});

// Route for uploading the profile image
app.post('/updateUserImage', requireAuth, checkUser, userImgUpload.single('profileImage'), async (req, res) => {
  
  try {
    // Get the user from res.locals
    const user = res.locals.user;

    // If the user already has a profile image that is not the default image
    if (user.profileImage && user.profileImage !== 'https://www.rmit.edu.vn/content/dam/rmit/vn/en/assets-for-production/images/staff/sam-goundar-it.jpg') {
      // Delete the existing profile image
      fs.unlink(path.join(__dirname, 'public', user.profileImage), err => {
        // Log any error that occurs while deleting the image
        if (err) console.error(err);
      });
    }

    // Extract the filename from the uploaded file
    let profileImage = "/images/userImage/" + (req.file ? req.file.filename : '');

    // If the user has sent '/images/userImage/', replace it with the default image URL
    if (profileImage === '/images/userImage/') {
      profileImage = 'https://www.rmit.edu.vn/content/dam/rmit/vn/en/assets-for-production/images/staff/sam-goundar-it.jpg';
    }

    // Update the user's profile image in the database
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id }, // find a user with the provided user ID
      { profileImage }, // update the user with the new image
      { new: true } // return the updated user
    );

    // If the user is not found, return a 404 error
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send a response indicating that the update was successful
    res.json({ message: 'Image update successful' });
  } catch (error) {
    // Log any error that occurs and return a 500 error
    console.error(error);
    res.status(500).json({ message: 'An error occurred while updating the user image' });
  }
});

// Route for updating the user's details
app.post('/updateUserDetails', requireAuth, checkUser, async (req, res) => {
  // Extract the full name, email, phone and password from the request body
  const { fullName, email, phone, password } = req.body;
  console.log(req.body);

  try {
    // Get the user ID from res.locals
    const userId = res.locals.user._id;

    // Salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's details in the database
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId }, // find a user with the provided user ID
      { fullName, email, phone, password: hashedPassword }, // update the user with the new details
      { new: true } // return the updated user
    );

    // If the user is not found, return a 404 error
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send a response indicating that the update was successful
    res.json({ message: 'Details update successful' });
  } catch (error) {
    // Log any error that occurs and return a 500 error
    console.error(error);
    res.status(500).json({ message: 'An error occurred while updating the user details' });
  }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
