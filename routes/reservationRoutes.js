const express = require('express');
const { checkUser, requireAuth, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
const reservationController = require('../controllers/reservationControllers');

router.get('/wishlist', requireAuth, checkUser, reservationController.wishlist_get);

// Add book to wishlist
router.post('/addToWishlist', requireAuth, checkUser, reservationController.add_to_wishlist_post);
router.post('/removeFromWishlist', requireAuth, checkUser, reservationController.remove_from_wishlist_post);

// Add book from wishlist to reservation
router.get('/createReservation', requireAuth, checkUser, reservationController.create_reservation_get);
router.post('/createReservation', requireAuth, checkUser, reservationController.create_reservation_post);
router.post('/addSelectedToReservation', requireAuth, checkUser, reservationController.reserve_selected_post);
router.post('/addAllToReservation', requireAuth, checkUser, reservationController.reserve_all_post);

// Reservation List
router.get('/reservations', requireAuth, checkUser, isAdmin, reservationController.reservations_get);
router.get('/userReservations', requireAuth, checkUser, reservationController.userReservations_get);

// Return book
router.post('/reservations/return', requireAuth, checkUser, isAdmin, reservationController.reservations_return_post);

module.exports = router;