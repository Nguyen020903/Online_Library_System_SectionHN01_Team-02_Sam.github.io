const express = require('express');
const { checkUser } = require('../middleware/authMiddleware');
const router = express.Router();
const bookController = require('../controllers/bookControllers');

// Check if User is Librarian
const isAdmin = async (req, res, next) => {
    if (res.locals.user && res.locals.user.isAdmin) {
        next(); // User is authenticated and is an admin, continue to the next middleware or route handler
    } else {
        res.status(403).send('You don\'t have permission to enter this page');
    }
};

// Add book
router.get('/addbook', checkUser, isAdmin, bookController.addbook_get);
router.post('/addbook', checkUser, isAdmin, bookController.addbook_post);

// Modify book
router.get('/update/:id', checkUser, isAdmin, bookController.updatebook_get);
router.post('/update/:id', checkUser, isAdmin, bookController.updatebook_post);

// Delete book
router.post('/delete/:id', checkUser, isAdmin, bookController.deletebook);

module.exports = router;
