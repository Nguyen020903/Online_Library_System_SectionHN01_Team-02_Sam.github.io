const jwt = require('jsonwebtoken');
const User = require('../models/user');

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // Check if the JWT token exists
  if (token) {
    jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
      if (err) {
        console.error(err.message);
        res.redirect('/login'); // Redirect to the login page if the token is not valid
      } else {
        // User is authenticated, you can access decodedToken to get user information
        console.log(decodedToken);
        next(); // Continue to the next middleware or route handler
      }
    });
  } else {
    res.redirect('/login'); // Redirect to the login page if the token is not present
  }
};

// Check current User
const checkUser = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
      if (err) {
        console.error(err.message);
        next();
      } else {
        // User is authenticated, access decodedToken to get user information
        console.log(decodedToken);
        const user = await User.findById(decodedToken.id);
        res.locals.user = user;
        next();
      }
    })
  } else {
    res.locals.user = null;
    next();
  }
};


module.exports = { requireAuth, checkUser };