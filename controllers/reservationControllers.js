const User = require('../models/user');
const Book = require('../models/book');

module.exports.wishlist_get = async (req, res) => {
  
  let user = res.locals.user;
  let books = [];

  if (user) {
    try {
      // Find the user's favorite books
      books = await Book.find({ _id: { $in: user.favoriteBook } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching the user\'s favorite books' });
    }
  }

  res.render('wishlist', { user, books });
}

module.exports.add_to_wishlist_post = async (req, res) => {
  const { bookId } = req.body;

  let user = res.locals.user;
  if (user) {
    try {
      const book = await Book.findById(bookId);

      if (book) {
        // Add the book_id to the user's favoriteBook array
        user.favoriteBook.push(bookId);
        // Save the updated user
        await user.save();
        // Send a success response back to the client
        res.status(200).json({ message: 'Book removed from wishlist successfully' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while adding the book to the cart' });
    }
  }

  // Send a 200 OK response
  res.status(200).end();
};

module.exports.remove_from_wishlist_post = async (req, res) => {
  const { bookId } = req.body;

  let user = res.locals.user;

  if (user) {
    try {
      const book = await Book.findById(bookId);

      if (book) {
        // Remove the book_id from the user's favoriteBook array
        user.favoriteBook.pull(bookId);
        // Save the updated user
        await user.save();

        // Send a success response back to the client
        res.status(200).json({ message: 'Book removed from wishlist successfully' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while removing the book from the wishlist' });
    }
  } else {
    // Handle case where user is not authenticated
    res.status(401).json({ error: 'User not authenticated' });
  }
};