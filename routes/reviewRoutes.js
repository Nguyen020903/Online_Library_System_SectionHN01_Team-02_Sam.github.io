const express = require('express');
const router = express.Router();
const { checkUser, requireAuth, isAdmin } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewControllers');

// Review Library
router.post('/libraryReview', checkUser, requireAuth, reviewController.library_review_post);

// Review Book
router.post('/bookReview', checkUser, requireAuth, reviewController.book_review_post);

module.exports = router;
