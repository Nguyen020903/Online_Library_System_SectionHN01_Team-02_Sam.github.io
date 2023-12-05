const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');
const User = require('../models/user');

const maxAge = 3 * 24 * 60 * 60;


const createToken = (id) => {
    return jwt.sign({ id }, 'your-secret-key', {
        expiresIn: maxAge,
    });
};

// Handle errors
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
        Object.values(err.errors).forEach(({ properties }) => {
            console.log(properties);
            errors[properties.path] = properties.message;

        });
    }

    return errors;
};


// Function for Signup (Get & Post method)
module.exports.signup_get = (req, res) => {
    res.render('signup');
};

module.exports.signup_post = async (req, res) => {
    const { fullName, email, password, confirmPassword } = req.body;
    console.log(fullName, email, password, confirmPassword);
    console.log(req.body);

    try {
        /* Create a new user */
        const newUser = new User({
            userType: req.body.userType,
            userFullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password, // Save the hashed password
            isAdmin: req.body.isAdmin,
        });

        /* Save User and Return */
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
                res.status(500).json({ err: err.message });
            }
            );

    } catch (err) {
        let error = handleErrors(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Function for Login (Get & Post method)
module.exports.login_get = (req, res) => {
    res.render('login');
};

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

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
module.exports.logout_get = async (req, res) => {
    res.cookie('jwt', '',  { maxAge: 1}); // Replace with blank cookie with small expiry time
    res.redirect('/');
};