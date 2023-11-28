const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/authRoutes');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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

// Database Connection
mongoose.connect('mongodb+srv://hmyle:ingsqEe3t4CevFzo@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.log(error.message));

// Use the `express.urlencoded` middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));

// app.get('*', checkUser, (req, res) => {
// });

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});