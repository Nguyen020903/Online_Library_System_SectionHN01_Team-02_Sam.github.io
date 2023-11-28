const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Database Connection
const dbURI =
  'mongodb+srv://hmyle:2XPKuoM05U0YdC0c@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority';
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));

// Homepage
app.get('/', async (req, res) => {
    res.render('login.html');
});


// Port Connect
app.listen(port, () => {
    console.log("port connected");
  });