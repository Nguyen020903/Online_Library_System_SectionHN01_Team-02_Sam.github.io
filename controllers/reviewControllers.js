// Import the necessary libraries and modules
const express = require('express');
const fs = require('fs');
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Category = require('../models/category');
const Publisher = require('../models/publisher');
const Review = require('../models/review');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');

// Function to post a library review
module.exports.library_review_post = async (req, res) => {
    // Extract review and rate from the request body
    const { review, rate } = req.body;

    // Create a new review
    const newReview = new Review({
        userId: res.locals.user._id, // User ID from the locals
        review: review, // Review text
        star: rate, // Rating
        type: 'For_Library' // Type of review
    });

    try {
        // Save the review and return the saved review
        const savedReview = await newReview.save();
        res.status(200).json(savedReview);
    } catch (err) {
        // Return an error message if the review could not be saved
        res.status(400).json({ message: err.message });
    }
}

// Function to post a book review
module.exports.book_review_post = async (req, res) => {
    // The function body goes here
}