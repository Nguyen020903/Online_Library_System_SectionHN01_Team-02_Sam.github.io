const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

// User Registration
router.get('/signup', authController.signup_get);
router.post('/signup', authController.signup_post);

// User Login
router.get('/login', authController.login_get);
router.post('/login', authController.login_post);

// User Logout
router.get('/logout', authController.logout_get);

module.exports = router;
