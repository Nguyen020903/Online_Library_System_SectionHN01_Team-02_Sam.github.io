const express = require('express');
const fs = require('fs');
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Category = require('../models/category');
const Publisher = require('../models/publisher');
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

// Add book
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
};

module.exports.addbook_post = async (req, res) => {
    console.log('hi');
    const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
    try {
        const book = await Book.create({ ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description });
        // Update the author with the book ID
        const updatedAuthor = await Author.findOneAndUpdate({ _id: author }, { $push: { book: book._id } }, { new: true });
        const updatedCategory = await Category.findOneAndUpdate({ _id: category }, { $push: { book: book._id } }, { new: true });
        const updatedPublisher = await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: book._id } }, { new: true });
        res.status(200).json(book, updatedAuthor, updatedCategory, updatedPublisher);
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
};

// Modify book
module.exports.updatebook_get = (req, res) => {
    res.render('updateBook');
}

// Update book
module.exports.updatebook_post = async (req, res) => {
    const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable } = req.body;

    try {
        // Find the book to update
        const updatedBook = await Book.findOneAndUpdate(
            { _id: req.params.id },
            {
                $set: {
                    ISBN: ISBN,
                    title: title,
                    author: author,
                    category: category,
                    publisher: publisher,
                    numberOfPages: numberOfPages,
                    bookCountAvailable: bookCountAvailable
                }
            },
            { new: true }
        );

        if (!updatedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Update the author, category, and publisher if provided
        if (author) {
            // Remove the book from the old author
            await Author.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
            await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
        }

        if (category) {
            // Remove the book from the old category
            await Category.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
            await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
        }

        if (publisher) {
            // Remove the book from the old publisher
            await Publisher.updateOne({ 'book._id': req.params.id }, { $pull: { book: { _id: req.params.id } } });
            await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
        }

        res.status(200).json({ message: 'Book updated successfully', updatedBook });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
};


// Delete book
module.exports.deletebook = async (req, res) => {
    try {
        let author, category, publisher = await Book.findOne({ _id: req.params.id }, (book) => {
            return book.author, book.category, book.publisher;
        });

        // Remove book from Author
        Author.update(
            { _id: author },
            { $pull: { 'book': { _id: req.params.id } } }
        );

        // Remove book from Category
        Category.update(
            { _id: category },
            { $pull: { 'book': { _id: req.params.id } } }
        );

        // Remove book from Publisher
        Publisher.update(
            { _id: publisher },
            { $pull: { 'book': { _id: req.params.id } } }
        );

        // Remove book
        Book.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Book deleted successfully', deletedBookId: req.params.id });

    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

// get and post for author, category, publisher
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