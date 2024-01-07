// Import the necessary libraries
const express = require('express');
const { checkUser, requireAuth, isAdmin } = require('../middleware/authMiddleware');
const reservationController = require('../controllers/reservationControllers');

// Initialize the Express router
const router = express.Router();

// Define the route for getting the wishlist
// The user must be authenticated to access this route
router.get('/wishlist', requireAuth, checkUser, reservationController.wishlist_get);

// Define the routes for managing the wishlist
// The user must be authenticated to access these routes
router.post('/addToWishlist', requireAuth, checkUser, reservationController.add_to_wishlist_post);
router.post('/removeFromWishlist', requireAuth, checkUser, reservationController.remove_from_wishlist_post);
router.post('/clearWishlist', requireAuth, checkUser, reservationController.clear_wishlist_post);

// Define the routes for creating a reservation
// The user must be authenticated to access these routes
router.get('/createReservation', requireAuth, checkUser, reservationController.create_reservation_get);
router.post('/createReservation', requireAuth, checkUser, reservationController.create_reservation_post);
router.post('/addSelectedToReservation', requireAuth, checkUser, reservationController.reserve_selected_post);
router.post('/addAllToReservation', requireAuth, checkUser, reservationController.reserve_all_post);

// Define the routes for managing reservations
// The user must be authenticated to access these routes
// Only admins can access the '/reservations' route
router.get('/reservations', requireAuth, checkUser, isAdmin, reservationController.reservations_get);
router.get('/userReservations', requireAuth, checkUser, reservationController.userReservations_get);
router.post('/reservations/borrow', requireAuth, checkUser, isAdmin, reservationController.reservations_borrowed_post);
router.post('/reservations/return', requireAuth, checkUser, isAdmin, reservationController.reservations_return_post);

// Export the router
module.exports = router;