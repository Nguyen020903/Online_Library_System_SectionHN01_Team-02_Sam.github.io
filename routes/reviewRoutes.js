// Import the necessary libraries
const express = require('express');
const { checkUser, requireAuth, isAdmin } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewControllers');

// Initialize the Express router
const router = express.Router();

// Define the route for posting a library review
// The user must be authenticated to access this route
router.post('/libraryReview', checkUser, requireAuth, reviewController.library_review_post);

// Define the route for posting a book review
// The user must be authenticated to access this route
router.post('/bookReview', checkUser, requireAuth, reviewController.book_review_post);

// Export the router
module.exports = router;