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

app.use(authRoutes);
app.use(bookRoutes);
app.use(reservationRoutes);

// using session to implement shopping cart
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
  req.session.cart = req.session.cart || {};

  let books = await Book.find();
  res.render('index', {books});
});

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
      if (user.profileImage) {
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


app.post('/addbook', (req, res, next) => {
  console.log('Request Body:', req.body);
  console.log('Request File:', req.file);
  next();
}, checkUser, isAdmin, multer({ storage: bookImageStorage }).single('bookImage'), async (req, res) => {  
  try {
    const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
    const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');

    const book = await Book.create({ ISBN, title, bookImage, author, category, publisher, numberOfPages, bookCountAvailable, description });
    const updatedAuthor = await Author.findOneAndUpdate({ _id: author }, { $push: { book: book._id } }, { new: true });
    const updatedCategory = await Category.findOneAndUpdate({ _id: category }, { $push: { book: book._id } }, { new: true });
    const updatedPublisher = await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: book._id } }, { new: true });
    res.status(200).json({book, updatedAuthor, updatedCategory, updatedPublisher});
  }
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
});
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});