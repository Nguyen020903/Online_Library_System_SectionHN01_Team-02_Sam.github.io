const express = require('express');
const { checkUser, requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();
const reservationController = require('../controllers/reservationControllers');

router.get('/wishlist', requireAuth, checkUser, reservationController.wishlist_get);

router.post('/addToWishlist', requireAuth, checkUser, reservationController.add_to_wishlist_post);
router.post('/removeFromWishlist', requireAuth, checkUser, reservationController.remove_from_wishlist_post);

router.post('/addOneToWishlist', requireAuth, checkUser, reservationController.add_to_wishlist_post);

router.get('/createReservation', requireAuth, checkUser, reservationController.create_reservation_get);
router.post('/createReservation', requireAuth, checkUser, reservationController.create_reservation_post);

router.get('/reservations', requireAuth, checkUser, reservationController.reservations_get);
router.post('/reservations/return', requireAuth, checkUser, reservationController.reservations_return_post);
router.get('/userReservations', requireAuth, checkUser, reservationController.userReservations_get);
module.exports = router;