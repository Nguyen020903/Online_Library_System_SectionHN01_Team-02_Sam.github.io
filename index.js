const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Database Connection
mongoose.connect('mongodb+srv://hmyle:ingsqEe3t4CevFzo@onlinelibrarysystem.dpdir84.mongodb.net/?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.log(error.message));

// Use the `express.urlencoded` middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});