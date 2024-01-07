// Import the necessary libraries
const express = require('express');
const { checkUser, requireAuth, isAdmin } = require('../middleware/authMiddleware');
const reservationController = require('../controllers/reservationControllers');

// Initialize the Express router
const router = express.Router();

// Define the route for getting the wishlist
// The user must be authenticated to access this route
router.get('/wishlist', requireAuth, checkUser, reservationController.wishlistGet);

// Define the routes for managing the wishlist
// The user must be authenticated to access these routes
router.post('/addToWishlist', requireAuth, checkUser, reservationController.addToWishlistPost);
router.post('/removeFromWishlist', requireAuth, checkUser, reservationController.removeFromWishlistPost);
router.post('/clearWishlist', requireAuth, checkUser, reservationController.clearWishlistPost);

// Define the routes for creating a reservation
// The user must be authenticated to access these routes
router.get('/createReservation', requireAuth, checkUser, reservationController.createReservationGet);
router.post('/createReservation', requireAuth, checkUser, reservationController.createReservationPost);
router.post('/addSelectedToReservation', requireAuth, checkUser, reservationController.reserveSelectedPost);
router.post('/addAllToReservation', requireAuth, checkUser, reservationController.reserveAllPost);

// Define the routes for managing reservations
// The user must be authenticated to access these routes
// Only admins can access the '/reservations' route
router.get('/reservations', requireAuth, checkUser, isAdmin, reservationController.reservationGet);
router.get('/userReservations', requireAuth, checkUser, reservationController.userReservationGet);
router.post('/reservations/borrow', requireAuth, checkUser, isAdmin, reservationController.reservationsBorrowedPost);
router.post('/reservations/return', requireAuth, checkUser, isAdmin, reservationController.reservationsReturnPost);

// Export the router
module.exports = router;