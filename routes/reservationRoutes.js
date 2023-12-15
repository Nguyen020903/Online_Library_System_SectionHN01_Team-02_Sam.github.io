const express = require('express');
const { checkUser, requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();
const reservationController = require('../controllers/reservationControllers');

router.post('/addToWishlist', requireAuth, checkUser, reservationController.add_to_wishlist_post);

module.exports = router;