const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/authRoutes');
const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Import model
const User = require('./models/user');
const Book = require('./models/book');
const BookCategory = require('./models/bookCategory');
const BookTransaction = require('./models/bookTransaction');
const {
    requireAuth,
    checkUser,
} = require('./middleware/authMiddleware');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(routes);

// using session to implement shopping cart
// app.use(
//   session({
//     secret: 'your-secret-key',
//     cookie: { maxAge: 60 * 60 * 24 * 24 * 7 },
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false },
//   })
// );

// Database Connection
mongoose.connect('mongodb+srv://hmyle:ingsqEe3t4CevFzo@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.log(error.message));

// For every route the status of current user will be cheked
app.get('*', checkUser);

app.get('/', (req,res) => {
  res.render('index');
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