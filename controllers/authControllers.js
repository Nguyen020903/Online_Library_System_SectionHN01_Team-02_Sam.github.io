const express = require('express');
const bcrypt = require('bcrypt');   
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');

const maxAge = 60 * 60 * 24 * 7;
const createToken = (id) => {
    return jwt.sign({ id }, 'user secret', {
        expiresIn: maxAge,
    });
};

module.exports.signup_get = (req, res) => {
    res.render('signup');
};

module.exports.signup_post = async (req, res) => {
    const { fullName, email, password, confirmPassword } = req.body;
    console.log(fullName, email, password, confirmPassword);
    console.log(req.body);

    try {
        /* Salting and Hashing the Password */
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(req.body.password, salt);

        /* Create a new user */
        const newUser = new User({
            userType: req.body.userType,
            userFullName: req.body.fullName,
            email: req.body.email,
            password: hashedPass, // Save the hashed password
            isAdmin: req.body.isAdmin,
        });

        /* Save User and Return */
        newUser.save()
            .then(() => res.status(200).json({ message: 'User registered successfully' }))
            .catch((error) => res.status(500).json({ error: error.message }));
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.login_get = (req, res) => {
    res.render('login');
};

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    try {
        let user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }

};