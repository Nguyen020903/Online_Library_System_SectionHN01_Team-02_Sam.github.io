const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require("./models/user");
const authController = require('../controllers/authControllers');

/* User Registration */
router.get("/signup", authController.signup_get);
router.post("/signup", authController.signup_post);

/* User Login */
router.get("/login", authController.login_get);
router.post("/login", authController.login_post);


export default router;
