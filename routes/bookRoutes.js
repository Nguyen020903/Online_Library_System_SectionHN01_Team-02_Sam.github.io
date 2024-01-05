const express = require('express');
const { checkUser, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
const bookController = require('../controllers/bookControllers');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// function for save book image
const bookImageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/images/bookImage/');
    },
    filename: function(req, file, cb) { // 'file' and 'cb' parameters were swapped
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, 'your-secret-key');
        const userId = decodedToken.id;
        // Get the current date
        const date = new Date();
        // Format the date
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
        // Add the date to the filename
        const newFilename = `${formattedDate}-${userId}-${file.originalname}`;
        cb(null, newFilename);
    }
  });
  
  const bookImageUpload = multer({ storage: bookImageStorage });

// Book detail page
// router.get('/bookDetail/:id', checkUser, isAdmin, bookController.bookdetail_get);
// router.post('/bookDetail/:id', checkUser, isAdmin, bookController.bookdetail_post);

// Search book
router.get('/searchResult', checkUser, bookController.search_get);

// Add book
router.get('/addbook', checkUser, isAdmin, bookController.addbook_get);
// router.post('/addbook', (req, res, next) => {
//       console.log('Request Body:', req.body);
//       console.log('Request File:', req.file);
//       next();
// }, checkUser, isAdmin, multer({ storage: bookImageStorage }).single('bookImage'), bookController.addbook_post);

// // Update book
// router.get('/updateBook/:id', checkUser, isAdmin, bookController.updatebook_get);
// router.post('/updateBook/:id', checkUser, isAdmin, bookImageUpload.single('bookImage'), bookController.updatebook_post);

// Delete book
router.post('/deletebook/:id', checkUser, isAdmin, bookController.deletebook);

//Route for author, category and publisher
router.get('/author',checkUser, isAdmin, bookController.author_get);
router.post('/author',checkUser, isAdmin, bookController.author_post);
router.get('/category',checkUser, isAdmin, bookController.category_get);
router.post('/category',checkUser, isAdmin, bookController.category_post);
router.get('/publisher',checkUser, isAdmin,bookController.publisher_get);
router.post('/publisher',checkUser, isAdmin, bookController.publisher_post);

module.exports = router;
