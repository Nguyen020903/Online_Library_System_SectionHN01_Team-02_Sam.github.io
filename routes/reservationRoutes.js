const express = require('express');
const { checkUser } = require('../middleware/authMiddleware');
const router = express.Router();
const reservationController = require('../controllers/reservationControllers');

router.post('/addToCart', checkUser, reservationController.add_to_cart_post);

module.exports = router;