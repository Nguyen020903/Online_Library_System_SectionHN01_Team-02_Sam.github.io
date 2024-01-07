// Import the necessary libraries
const express = require('express');
const authController = require('../controllers/authControllers');

// Initialize the Express router
const router = express.Router();

// Define the routes for user registration
// GET route for displaying the signup page
router.get('/signup', authController.signup_get);
// POST route for submitting the signup form
router.post('/signup', authController.signup_post);
// POST route for creating a librarian account
router.post('/create-librarian-account', authController.create_librarian_account_post);

// Define the routes for user login
// GET route for displaying the login page
router.get('/login', authController.login_get);
// POST route for submitting the login form
router.post('/login', authController.login_post);

// Define the route for user logout
// GET route for logging out the user
router.get('/logout', authController.logout_get);

// Export the router
module.exports = router;