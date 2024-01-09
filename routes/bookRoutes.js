// Import the necessary libraries
const express = require('express');
const { checkUser, isAdmin } = require('../middleware/authMiddleware');
const bookController = require('../controllers/bookControllers');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Initialize the Express router
const router = express.Router();

// Define the storage location and naming convention for book images
const bookImageStorage = multer.diskStorage({
  // Set the destination for storing book images
  destination: function(req, file, cb) {
    cb(null, 'public/images/bookImage/');
  },
  // Define the filename for the uploaded image
  filename: function(req, file, cb) {
    // Extract the JWT token from the cookies
    const token = req.cookies.jwt;
    // Verify the JWT token and extract the user ID
    const decodedToken = jwt.verify(token, 'your-secret-key');
    const userId = decodedToken.id;

    // Get the current date and time
    const date = new Date();
    // Format the date and time in the 'YYYY-MM-DD-HH-MM-SS' format
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

    // Construct the new filename using the formatted date and time, user ID, and original file name
    const newFilename = `${formattedDate}-${userId}-${file.originalname}`;

    // Set the new filename
    cb(null, newFilename);
  }
});

// Initialize multer with the defined storage
const bookImageUpload = multer({ storage: bookImageStorage });

// Define the routes for book details
router.get('/allBooks', checkUser, bookController.allBooksGet);
router.get('/bookDetail/:id', checkUser, bookController.bookDetailGet);

// Define the routes for searching books
router.get('/searchResult', checkUser, bookController.searchGet);

// Define the routes for adding books
router.get('/addbook', checkUser, isAdmin, bookController.addBookGet);
router.post('/addbook', checkUser, isAdmin, bookImageUpload.single('bookImage'), bookController.addBookPost);

// Define the routes for updating books
router.get('/updateBook/:id', checkUser, isAdmin, bookController.updateBookGet);
router.post('/updateBook/:id', checkUser, isAdmin, bookImageUpload.single('bookImage'), bookController.updateBookPost);
router.post('/updateBookDetail/:id', checkUser, isAdmin, bookController.updateBookDetailPost);
router.post('/updateBookImage/:id', checkUser, isAdmin, bookImageUpload.single('bookImage'), bookController.updateBookImagePost);

// Define the routes for deleting books
router.post('/deleteBook/:id', checkUser, isAdmin, bookController.deleteBook);

// Define the routes for managing authors, categories, and publishers
router.post('/author', checkUser, isAdmin, bookController.authorPost);
router.post('/category', checkUser, isAdmin, bookController.categoryPost);;
router.post('/publisher', checkUser, isAdmin, bookController.publisherPost);
router.post('/deleteAuthor/:id', checkUser, isAdmin, bookController.deleteAuthor);
router.post('/deleteCategory/:id', checkUser, isAdmin, bookController.deleteCategory);
router.post('/deletePublisher/:id', checkUser, isAdmin, bookController.deletePublisher);

// get for category
router.get('/category', checkUser, isAdmin, bookController.categoryGet);
// Export the router
module.exports = router;