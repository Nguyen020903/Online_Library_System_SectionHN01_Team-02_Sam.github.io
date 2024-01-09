const express = require('express');
const fs = require('fs');
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Category = require('../models/category');
const Publisher = require('../models/publisher');
const Transaction = require('../models/transaction')
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

const handleErrorsforaddbook = (err) => {
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
};

module.exports.allBooksGet = async (req, res) => {
    const books = await Book.find().populate('author').populate('category');
    const categories = await Category.find();
    res.render('allBooks', {books, categories});
}

// Book detail page
module.exports.bookDetailGet = async (req, res) => {
    try {
        const authors = await Author.find();
        const categories = await Category.find();
        const publishers = await Publisher.find();
        const book = await Book.findById(req.params.id).populate('author').populate('category').populate('publisher');
        res.render('bookDetail', { book: book, authors: authors, categories: categories, publishers: publishers });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
}

module.exports.addBookGet = async (req, res) => {
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

module.exports.addBookPost = async (req, res) => {
    try {
        const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
        let bookData = { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description };

        if (req.file) {
            bookData.bookImage = "/images/bookImage/" + req.file.filename;
        }

        const book = await Book.create(bookData);
        const updatedAuthor = await Author.findOneAndUpdate({ _id: author }, { $push: { book: book._id } }, { new: true });
        const updatedCategory = await Category.findOneAndUpdate({ _id: category }, { $push: { book: book._id } }, { new: true });
        const updatedPublisher = await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: book._id } }, { new: true });
        res.status(200).json({ book, updatedAuthor, updatedCategory, updatedPublisher });
    }
    catch (err) {
        let error = handleErrorsforaddbook(err);
        res.status(400).json({ error });
    }
}

module.exports.updateBookGet = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        const authors = await Author.find();
        const categories = await Category.find();
        const publishers = await Publisher.find();
        res.render('updateBook', { book: book, authors: authors, categories: categories, publishers: publishers });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
}

module.exports.updateBookPost = async (req, res) => {
    const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
    try {
        const book = await Book.findById(req.params.id);
        if (book.bookImage) {
            fs.unlink(path.join(__dirname, 'public', book.bookImage), err => {
                if (err) console.error(err);
            });
        }
        const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ISBN, title, bookImage, author, category, publisher, numberOfPages, bookCountAvailable, description }, { new: true });
        // Update the author, category, and publisher if provided
        if (author) {
            await Author.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });
            await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
        }

        if (category) {
            await Category.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });
            await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
        }

        if (publisher) {
            await Publisher.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });
            await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
        }

        if (!updatedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json({ message: 'Book update successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while updating the book' });
    }
}

module.exports.updateBookDetailPost = async (req, res) => {
    console.log(req.body)
    const { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description } = req.body;
    try {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ISBN, title, author, category, publisher, numberOfPages, bookCountAvailable, description }, { new: true });

        // Update the author, category, and publisher if provided
        if (author) {
            await Author.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });
            await Author.findOneAndUpdate({ _id: author }, { $push: { book: req.params.id } });
        }

        if (category) {
            await Category.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });
            await Category.findOneAndUpdate({ _id: category }, { $push: { book: req.params.id } });
        }

        if (publisher) {
            await Publisher.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });
            await Publisher.findOneAndUpdate({ _id: publisher }, { $push: { book: req.params.id } });
        }

        if (!updatedBook) {
        return res.status(404).json({ message: 'Book not found' });
        }
        res.json({ message: 'Book update successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while updating the book' });
    }
}

module.exports.updateBookImagePost = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (book.bookImage) {
        fs.unlink(path.join(__dirname, 'public', book.bookImage), err => {
            if (err) console.error(err);
        });
        }
        const bookImage = "/images/bookImage/" + (req.file ? req.file.filename : '');
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, { bookImage }, { new: true });

        if (!updatedBook) {
        return res.status(404).json({ message: 'Book not found' });
        }
        res.json({ message: 'Book image update successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while updating the book image' });
    }
}


module.exports.searchGet = async (req, res) => {
    const searchQuery = req.query.query;

    try {
        const books = await Book.find({ title: new RegExp(searchQuery, 'i') }).populate('author');
        res.render('searchResult', { searchQuery: searchQuery, books: books });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while searching for books');
    }
}

module.exports.deleteBook = async (req, res) => {
    const bookId = req.params.id;
    try {
        let book = await Book.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        let author = book.author;
        let category = book.category;
        let publisher = book.publisher;

        // Remove book from User reservations
        await User.updateMany(
            { activeTransactions: bookId, prevTransactions: bookId },
            { $pull: { activeTransactions: bookId, prevTransactions: bookId }}
        );

        // Remove Transaction that has this book
        await Transaction.deleteMany({ bookId: bookId });

        // Remove book from Author
        await Author.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });

        // Remove book from Category
        await Category.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });

        // Remove book from Publisher
        await Publisher.updateOne({ book: { $in: [req.params.id] } }, { $pull: { book: req.params.id } });

        // Remove Image
        if (book.bookImage && book.bookImage !== 'https://i.ibb.co/K05xQk1/book7.png') {
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

// Post for author, category, publisher

module.exports.authorPost = async (req, res) => {
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

module.exports.categoryPost = async (req, res) => {
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

module.exports.publisherPost = async (req, res) => {
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

// Delete for author, category, publisher

module.exports.deleteAuthor = async (req, res) => {
    const authorId = req.params.id;
    try {
        let author = await Author.findOne({ _id: authorId });
        if (!author) {
            return res.status(404).json({ message: 'Author not found' });
        }

        // Remove author
        await Author.deleteOne({ _id: authorId });

        res.status(200).json({ message: 'Author deleted successfully', deletedAuthorId: authorId });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.deletePublisher = async (req, res) => {
    const publisherId = req.params.id;
    try {
        let publisher = await Publisher.findOne({ _id: publisherId });
        if (!publisher) {
            return res.status(404).json({ message: 'Publisher not found' });
        }

        // Remove publisher
        await Publisher.deleteOne({ _id: publisherId });

        res.status(200).json({ message: 'Publisher deleted successfully', deletedPublisherId: publisherId });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.deleteCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        let category = await Category.findOne({ _id: categoryId });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Remove category
        await Category.deleteOne({ _id: categoryId });

        res.status(200).json({ message: 'Category deleted successfully', deletedCategoryId: categoryId });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}
module.exports.categoryGet = async (req, res) => {
    res.render('category');
}