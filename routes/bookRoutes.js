const express = require('express');
const { checkUser } = require('../middleware/authMiddleware');
const router = express.Router();
const bookController = require('../controllers/bookControllers');

// Check if User is Librarian
const isAdmin = async (req, res, next) => {
    if (res.locals.user && res.locals.user.isAdmin) {
        next(); // User is authenticated and is an admin, continue to the next middleware or route handler
    } else {
        res.status(403).send('You do not have permission to enter this page');
    }
};

// Book detail page
router.get('/bookDetail/:id', checkUser, isAdmin, bookController.bookdetail_get);

// Add book
router.get('/addbook', checkUser, isAdmin, bookController.addbook_get);
// router.post('/addbook', checkUser, isAdmin, bookController.addbook_post);

// Update book
router.get('/update/:id', checkUser, isAdmin, bookController.updatebook_get);
router.post('/update/:id', checkUser, isAdmin, bookController.updatebook_post);

// Delete book
router.post('/delete/:id', checkUser, isAdmin, bookController.deletebook);

//Route for author, category and publisher
router.get('/author',checkUser, isAdmin, bookController.author_get);
router.post('/author',checkUser, isAdmin, bookController.author_post);
router.get('/category',checkUser, isAdmin, bookController.category_get);
router.post('/category',checkUser, isAdmin, bookController.category_post);
router.get('/publisher',checkUser, isAdmin,bookController.publisher_get);
router.post('/publisher',checkUser, isAdmin, bookController.publisher_post);
module.exports = router;
module.exports = { isAdmin };
