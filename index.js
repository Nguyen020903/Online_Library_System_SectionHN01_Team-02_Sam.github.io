const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const Agenda = require('agenda');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Import model
const User = require('./models/user');
const Book = require('./models/book');

const {
    requireAuth,
    checkUser,
} = require('./middleware/authMiddleware');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('*', checkUser);

app.use(authRoutes);
app.use(bookRoutes);
app.use(reservationRoutes);

// using session to implement shopping cart
app.use(
  session({
    secret: 'your-secret-key',
    cookie: { maxAge: 60 * 60 * 24 * 24 * 7 },
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
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

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});