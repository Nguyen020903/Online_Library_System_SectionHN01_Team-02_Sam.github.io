const express = require('express');
const fs = require('fs');
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Category = require('../models/category');
const Publisher = require('../models/publisher');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');


// error handler, use to handle error message from models (author,book, category and publisher)
const handleErrors = (err) => {
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
}

// Book detail page
// module.exports.bookdetail_get = async (req, res) => {
//     try {
//         const book = await Book.findById(req.params.id);
//         res.render('bookDetail', { book: book });
//     } catch (err) {
//         console.error(err);
//         res.redirect('/');
//     }
// }

// module.exports.bookdetail_post = async (req, res) => {
//     try {
//         const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.redirect(`/bookDetail/${updatedBook._id}`);
//     } catch (err) {
//         console.error(err);
//         res.redirect('/');
//     }
//   }

// function for save book image
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

  module.exports.addbook_get = async (req, res) => {
        try {
            const authors = await Author.find();
            const categories = await Category.find();
            const publishers = await Publisher.find();
            res.render('addBook', { authors, categories, publishers });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }

// module.exports.addbook_post = async (req, res) => {  
//     try {
//     const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
//     let bookData = { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description };

//     if (req.file) {
//         bookData.bookImage = "/images/bookImage/" + req.file.filename;
//     }

//     const book = await Book.create(bookData);
//     const updatedAuthor = await Author.findOneAndUpdate({ _id: author }, { $push: { book: book._id } }, { new: true });
//     const updatedCategory = await Category.findOneAndUpdate({ _id: category }, { $push: { book: book._id } }, { new: true });
//     const updatedPublisher = await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: book._id } }, { new: true });
//     res.status(200).json({book, updatedAuthor, updatedCategory, updatedPublisher});
//     }
//     catch (err) {
//     }
// }

// module.exports.updatebook_get = async (req, res) => {
//     try {
//         const book = await Book.findById(req.params.id);
//         const authors = await Author.find();
//         const categories = await Category.find();
//         const publishers = await Publisher.find();
//         res.render('updateBook', { book: book, authors: authors, categories: categories, publishers: publishers });
//     } catch (err) {
//         console.error(err);
//         res.redirect('/');
//     }
// }

// module.exports.updatebook_post = async (req, res) => {
//     const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
//     try{
//       const book = await Book.findById(req.params.id);
//       if (book.bookImage && book.bookImage != 'https://drive.google.com/uc?id=1j9oMUsNA88sQYIgwRpD2FPBKZXlbYUyF') {
//         fs.unlink(path.join(path.resolve(__dirname, '..'), 'public', book.bookImage), err => {
//             if (err) console.error(err);
//         });
//       }
//       const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');
  
//       const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ISBN, title, bookImage, author, category, publisher, numberOfPages, bookCountAvailable, description }, { new: true });
//       // Update the author, category, and publisher if provided
//       if (author) {
//         // Remove the book from the old author
//         await Author.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
//         await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
//     }
  
//     if (category) {
//         // Remove the book from the old category
//         await Category.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
//         await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
//     }
  
//     if (publisher) {
//         // Remove the book from the old publisher
//         await Publisher.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
//         await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
//     }
  
//       if (!updatedBook) {
//         return res.status(404).json({ message: 'Book not found' });
//       }
//       res.json({ message: 'Book update successful' });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: 'An error occurred while updating the book' });
//     }
// }

module.exports.deletebook = async (req, res) => {
    const bookId = req.params.id;
    try {
        let book = await Book.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        let author = book.author;
        let category = book.category;
        let publisher = book.publisher;

        // Remove book from Author
        await Author.updateOne(
            { _id: author },
            { $pull: { 'book': { _id: req.params.id } } }
        );

        // Remove book from Category
        await Category.updateOne(
            { _id: category },
            { $pull: { 'book': { _id: req.params.id } } }
        );

        // Remove book from Publisher
        await Publisher.updateOne(
            { _id: publisher },
            { $pull: { 'book': { _id: req.params.id } } }
        );

        // remove Image
        if (book.bookImage && book.bookImage !== 'https://drive.google.com/uc?id=1j9oMUsNA88sQYIgwRpD2FPBKZXlbYUyF') {
            fs.unlink(path.join(__dirname, 'public', book.bookImage), err => {
                if (err) console.error(err);
            });
        }

        // Remove book
        await Book.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Book deleted successfully', deletedBookId: bookId });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

// Get and post for author, category, publisher
module.exports.author_get = (req, res) => {
    res.render('author');
}

module.exports.author_post = async (req, res) => {
    const { name } = req.body;
    try {
        const author = await Author.create({ name });
        res.status(200).json(author);
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}
module.exports.category_get = (req, res) => {
    res.render('category');
}

module.exports.category_post = async (req, res) => {
    const { name } = req.body;
    try {
        const category = await Category.create({ name });
        res.status(200).json(category);
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}


module.exports.publisher_get = (req, res) => {
    res.render('publisher');
}

module.exports.publisher_post = async (req, res) => {
    const { name } = req.body;
    try {
        const publisher = await Publisher.create({ name });
        res.status(200).json(publisher);
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}