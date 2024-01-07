// Import the necessary libraries
const express = require('express');
const authController = require('../controllers/authControllers');

// Initialize the Express router
const router = express.Router();

// Define the routes for user registration
// GET route for displaying the signup page
router.get('/signup', authController.signUpGet);
// POST route for submitting the signup form
router.post('/signup', authController.signUpPost);
// POST route for creating a librarian account
router.post('/create-librarian-account', authController.createLibrarianAccountPost);

// Define the routes for user login
// GET route for displaying the login page
router.get('/login', authController.loginGet);
// POST route for submitting the login form
router.post('/login', authController.loginPost);

// Define the route for user logout
// GET route for logging out the user
router.get('/logout', authController.logoutGet);

// Export the router
module.exports = router;