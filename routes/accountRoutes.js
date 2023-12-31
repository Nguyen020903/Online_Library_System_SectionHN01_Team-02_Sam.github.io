const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountControllers');
const { requireAuth, checkUser, isAdmin } = require('../middleware/authMiddleware');

router.get('/myAccount', requireAuth, checkUser, isAdmin, accountController.myaccount_get);

module.exports = router;

