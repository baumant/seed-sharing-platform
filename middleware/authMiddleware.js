// middleware/authMiddleware.js

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
};
