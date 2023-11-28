const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // Check if the JWT token exists
  if (token) {
    jwt.verify(token, "your-secret-key", async (err, decodedToken) => {
      if (err) {
        console.error(err);
        res.redirect("/login"); // Redirect to the login page if the token is not valid
      } else {
        // User is authenticated, you can access decodedToken to get user information
        console.log(decodedToken);
        next(); // Continue to the next middleware or route handler
      }
    });
  } else {
    res.redirect("/login"); // Redirect to the login page if the token is not present
  }
};

// check current  user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, "user secret", async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.locals.user = null;
        next();
      } else {
        user = await User.findById(decodedToken.id);
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

module.export = { requireAuth, checkUser };
