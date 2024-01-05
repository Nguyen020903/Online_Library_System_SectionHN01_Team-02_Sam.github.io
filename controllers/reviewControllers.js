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

// Review Library
module.exports.library_review_post = async (req, res) => {
    const { review, rate } = req.body;


    const newReview = new Review({
        userId: res.locals.user._id,
        review: review,
        star: rate,
        type: 'For_Library'
    });

    try {
        const savedReview = await newReview.save();
        res.status(200).json(savedReview);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Review Book
module.exports.book_review_post = async (req, res) => {

}