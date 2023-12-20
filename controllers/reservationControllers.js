const User = require('../models/user');
const Book = require('../models/book');
const Transaction = require('../models/transaction');

module.exports.wishlist_get = async (req, res) => {
  
  let user = res.locals.user;
  let books = [];

  if (user) {
    try {
      // Find the user's favorite books
      books = await Book.find({ _id: { $in: user.favoriteBook } })
        .populate('author') // populate author details
        .populate('category') // populate category details
        .exec();
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
        res.status(200).json({ message: 'Book added to wishlist successfully' });
        
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


module.exports.create_reservation_get = async (req, res) => {
  const users = await User.find();
  const books = await Book.find();

  res.render('createReservation', { users, books });
}

module.exports.create_reservation_post = async (req, res) => {
  const { userId, bookId, pickUpDate } = req.body;
  console.log(userId, bookId, pickUpDate);

  try {
    const user = await User.findById(userId);
    const book = await Book.findById(bookId);

    if (user && book) {
      let status = 'Pending';
      
      if (book.bookCountAvailable > 0) {
        status = 'Reserved'
      }

      const transaction = new Transaction({
        userId: user._id,
        bookId: book._id,
        pickUpDate: pickUpDate,
        status: status,
      });

      console.log(transaction);

      // Save the transaction
      const savedTransaction = await transaction.save();

      // Add the transaction to the user's transactions
      user.activeTransactions.push(transaction._id);
      // Save the updated user
      await user.save();

      // Add the transaction to the book's transactions
      book.transactions.push(transaction._id);
      // Save the updated book
      await book.save();

      // Send a success response back to the client
      res.status(200).json({ message: 'Reservation created successfully' , savedTransaction});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the reservation' });
  }
}