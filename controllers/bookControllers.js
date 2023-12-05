const express = require('express');
const fs = require('fs');
const User = require('../models/user');
const Book = require('../models/book');

// Add book
module.exports.addbook_get = (req, res) => {
    res.render('addBook');
};

module.exports.addbook_post = (req, res) => {
    const { ISBN, title, publisher, numberOfPages, bookCountAvailable } = req.body;
    console.log(ISBN, title, publisher, numberOfPages, bookCountAvailable);

    try {
        // Create a book
        const newBook = new Book({
            ISBN: ISBN,
            title: title,
            publisher: publisher,
            numberOfPages: numberOfPages,
            bookCountAvailable: bookCountAvailable
        });

        newBook.save()
        .then(() => {
            console.log('Book added successfully.');
        })
        .catch((err) => {
            // let error = handleErrors(err);
            res.status(500).json({ err: err.message });
        });
    } catch (error) {
        // let error = handleErrors(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Modify book
module.exports.updatebook_get = (req, res) => {
    res.render('updateBook');
}

module.exports.updatebook_post = (req, res) => {
    const { ISBN, title, publisher, numberOfPages, bookCountAvailable } = req.body;
    console.log(ISBN, title, publisher, numberOfPages, bookCountAvailable);
    
    // Update book in database
    Book.updateOne( {_id : req.params.id }, {
        $set: {
            ISBN: ISBN,
            title: title,
            publisher: publisher,
            numberOfPages: numberOfPages,
            bookCountAvailable: bookCountAvailable
        }
    });
}

// Delete book
module.exports.deletebook = (req, res) => {
    Book.deleteOne({ _id: req.params.id });
}
