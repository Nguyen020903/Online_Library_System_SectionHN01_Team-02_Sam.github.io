// Import the necessary libraries and modules
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');
const User = require('../models/user');
const { isAdmin } = require('../middleware/authMiddleware');

// Define the maximum age for the JWT token (3 days)
const maxAge = 3 * 24 * 60 * 60;

// Function to create a JWT token
const createToken = (id) => {
    return jwt.sign({ id }, 'your-secret-key', {
        expiresIn: maxAge,
    });
};

// Function to handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: '' };

    // Incorrect Email
    if (err.message === 'Incorrect email') {
        errors.email = 'That email is not registered';
    }

    // Incorrect Password
    if (err.message === 'Incorrect password') {
        errors.password = 'That password is invalid';
    }

    // Duplicate Error Code
    if (err.code == 11000) {
        errors.email = 'That email has already registered';
        return errors;
    }

    // Validation Errors
    if (err.message.includes('User validation failed')) {
        console.log('err.errors:', err.errors); // Log the err.errors array
    
        Object.values(err.errors).forEach(({ properties }) => {
            console.log('properties:', properties); // Log each properties object
    
            if (properties) {
                errors[properties.path] = properties.message;
            }
        });
    }

    return errors;
};

// Function for Signup (Get & Post method)
module.exports.signUpGet = (req, res) => {
    res.render('login_&_signup');
};

module.exports.signUpPost = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        // Create a new user
        const newUser = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password, // Save the hashed password
            isAdmin: Boolean(req.body.isAdmin),
        });

        // Save User and Return
        newUser.save()
            .then((user) => {
                // Create Token for current user
                const token = createToken(user._id);

                // Create Cookie based on user information
                res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
                res.status(200).json({ user: user._id });
            })
            .catch((err) => {
                let error = handleErrors(err);
                res.status(500).json({ error: err.message });
            }
            );

    } catch (err) {
        let error = handleErrors(err);
        res.status(400).json({ error });
    }
};

module.exports.createLibrarianAccountPost = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        // Create a new user
        const newUser = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password, // Save the hashed password
            isAdmin: true,
        });

        // Save User and Return
        newUser.save()
            .then((user) => {
                res.status(200).json({ user: user._id });
            })
            .catch((err) => {
                let error = handleErrors(err);
                res.status(500).json({ error: err.message });
            }
            );

    } catch (err) {
        let error = handleErrors(err);
        res.status(400).json({ error });
    }
};

// Function for Login (Get & Post method)
module.exports.loginGet = (req, res) => {
    res.render('login_&_signup');
};

module.exports.loginPost = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password);

        // Create Token for current user
        const token = createToken(user._id);

        // Create Cookie based on user information
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });

        res.status(200).json({ user: user._id });
    } catch (err) {
        let error = handleErrors(err);
        res.status(400).json({ error });
    }
};

// Function for Logout (Get method)
module.exports.logoutGet = async (req, res) => {
    res.cookie('jwt', '',  { maxAge: 1}); // Replace with blank cookie with small expiry time
    res.redirect('/');
};