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
      } else {
        // Handle case where book with the given ID is not found
        return res.status(404).json({ error: 'Book not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while adding the book to the cart' });
    }
  }

  // Send a 200 OK response
  res.status(200).end();
};