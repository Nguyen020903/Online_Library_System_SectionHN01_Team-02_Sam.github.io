const User = require('../models/user');
const Book = require('../models/book');
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');
const { getUserById, getBookById } = require('../middleware/nameMiddleware');

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

  res.render('wishlistcart', { user, books });
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

// Create reservation
module.exports.create_reservation_get = async (req, res) => {
  const users = await User.find();
  const books = await Book.find();

  res.render('createReservation', { users, books });
}

module.exports.create_reservation_post = async (req, res) => {
  const { bookId } = req.body;

  try {
    const user = res.locals.user;
    const book = await Book.findById(bookId);

    if (user && book) {
      console.log(book.bookStatus);

      if (book.bookStatus !== 'Available') {
        return res.status(400).json({ error: 'Book is not available' });
      }

      let status = 'Pending';
      let transaction;

      if (book.bookCountAvailable >= 1) {
        status = 'Reserved';
        book.bookCountAvailable -= 1;
        let pickUpDate = new Date(); // set pickUpDate to today's date

        if (book.bookCountAvailable === 0) book.bookStatus = 'Borrowed';

        // Calculate the returnDate
        const pickUpDateObj = new Date(pickUpDate);
        pickUpDateObj.setDate(pickUpDateObj.getDate() + 14);
        const returnDate = pickUpDateObj;

        transaction = new Transaction({
          userId: user._id,
          bookId: book._id,
          pickUpDate: pickUpDate,
          returnDate: returnDate,
          status: status,
        });

      } else {
        transaction = new Transaction({
          userId: user._id,
          bookId: book._id,
          status: status,
        });
      }

      console.log(transaction);

      // Save the transaction
      const savedTransaction = await transaction.save();

      // Add the transaction to the user's transactions
      user.activeTransactions.push(transaction._id);
      user.favoriteBook.pull(bookId);
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

module.exports.reservations_get = async (req, res) => {
  try {
    // Fetch transactions from the database
    const transactions = await Transaction.find();

    await Promise.all(transactions.map(async (transaction) => {
      if ((transaction.returnDate < Date.now() && transaction.status == 'Reserved') || (transaction.returnDate < Date.now() && transaction.status == 'Overdue')) {
        await Transaction.findByIdAndUpdate(
          transaction._id, 
          { 
            $set: { 
              status: 'Overdue',
              fine: 1000 * Math.floor((Date.now() - new Date(transaction.returnDate)) / (1000 * 60 * 60 * 24))
            }
          },
          { new: true },
        );
      }
    }));

    // Fetch user and book details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        const userEmail = await getUserById(transaction.userId).email;
        const bookTitle = await getBookById(transaction.bookId).title;

        return {
          _id: transaction._id,
          userEmail: userEmail,
          bookTitle: bookTitle,
          status: transaction.status,
          pickUpDate: transaction.pickUpDate,
          returnDate: transaction.returnDate,
          fine: transaction.fine,
        };
      })
    );

    // Render the template with transaction data
    res.render('allreservation', { transactions: transactionsWithDetails });
  } catch (error) {
    console.error('Error processing transactions:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports.reserve_all_post = async (req, res) => {
  const { bookIds } = req.body;

  try {
    let user = res.locals.user;

    if (user && Array.isArray(bookIds) && bookIds.length > 0) {
      const books = await Book.find({ _id: { $in: bookIds } });

      let transactions = [];

      for (const book of books) {
        if (book.bookStatus !== "Available") {
          return res
            .status(400)
            .json({ error: `Book ${book.title} is not available` });
        }

        let status = "Pending";
        let transaction;

        if (book.bookCountAvailable >= 1) {
          status = "Reserved";
          book.bookCountAvailable -= 1;
          let pickUpDate = new Date(); // set pickUpDate to today's date

          if (book.bookCountAvailable === 0) book.bookStatus = "Borrowed";

          // Calculate the returnDate
          const pickUpDateObj = new Date(pickUpDate);
          pickUpDateObj.setDate(pickUpDateObj.getDate() + 14);
          const returnDate = pickUpDateObj;

          transaction = new Transaction({
            userId: user._id,
            bookId: book._id,
            pickUpDate: pickUpDate,
            returnDate: returnDate,
            status: status,
          });
        } else {
          transaction = new Transaction({
            userId: user._id,
            bookId: book._id,
            status: status,
          });
        }

        console.log(transaction);

        // Save the transaction
        const savedTransaction = await transaction.save();
        transactions.push(savedTransaction);

        // Add the transaction to the user's transactions
        user.activeTransactions.push(transaction._id);
        user.favoriteBook.pull(book._id);
        // Save the updated user
        await user.save();

        // Add the transaction to the book's transactions
        book.transactions.push(transaction._id);

        // Save the updated book
        await book.save();
      }

      res.status(200).json({ message: "Selected books has been reserved.", transactions });
    } else {
      res
        .status(400)
        .json({ error: "Invalid request. Please provide valid bookIds." });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
};

module.exports.reserve_selected_post = async (req, res) => {
  const { bookIds } = req.body;

  try {
    let user = res.locals.user;

    if (user && Array.isArray(bookIds) && bookIds.length > 0) {
      const books = await Book.find({ _id: { $in: bookIds } });

      let transactions = [];

      for (const book of books) {
        if (book.bookStatus !== "Available") {
          return res
            .status(400)
            .json({ error: `Book ${book.title} is not available` });
        }

        let status = "Pending";
        let transaction;

        if (book.bookCountAvailable >= 1) {
          status = "Reserved";
          book.bookCountAvailable -= 1;
          let pickUpDate = new Date(); // set pickUpDate to today's date

          if (book.bookCountAvailable === 0) book.bookStatus = "Borrowed";

          // Calculate the returnDate
          const pickUpDateObj = new Date(pickUpDate);
          pickUpDateObj.setDate(pickUpDateObj.getDate() + 14);
          const returnDate = pickUpDateObj;

          transaction = new Transaction({
            userId: user._id,
            bookId: book._id,
            pickUpDate: pickUpDate,
            returnDate: returnDate,
            status: status,
          });
        } else {
          transaction = new Transaction({
            userId: user._id,
            bookId: book._id,
            status: status,
          });
        }

        console.log(transaction);

        // Save the transaction
        const savedTransaction = await transaction.save();
        transactions.push(savedTransaction);

        // Add the transaction to the user's transactions
        user.activeTransactions.push(transaction._id);
        user.favoriteBook.pull(book._id);
        // Save the updated user
        await user.save();

        // Add the transaction to the book's transactions
        book.transactions.push(transaction._id);

        // Save the updated book
        await book.save();
      }

      res.status(200).json({ message: "Selected books has been reserved.", transactions });
    } else {
      res
        .status(400)
        .json({ error: "Invalid request. Please provide valid bookIds." });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
};

module.exports.reservations_return_post = async (req, res) => {
  try {
    const id = req.body.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid id:', id);
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const transaction = await Transaction.findByIdAndUpdate(id, { status: 'Returned' }, { new: true });
    if (!transaction) {
      console.error('Transaction not found:', id);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    // Remove the transaction from the book's transactions
    const book = await Book.findByIdAndUpdate(transaction.bookId,{ $pull: { transactions: id } },{ new: true }
    );
    if (!book) {
      console.error('Book not found:', transaction.bookId);
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Update the book's bookCountAvailable + 1
    const bookStatus = await Book.findByIdAndUpdate(
      transaction.bookId,
      {
        $inc: { bookCountAvailable: 1 },
        $set: { bookStatus: 'Available' }
      },
      { new: true }
    );

    // Update the user's activeTransactions to prevTransactions
    const user = await User.findByIdAndUpdate(transaction.userId, { $pull: { activeTransactions: id }, $push: { prevTransactions: id } }, { new: true });
    if (!user) {
      console.error('User not found:', transaction.userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false });
  }
};

// update reservation status from Reserved to Borrowed
module.exports.reservations_borrowed_post = async (req, res) => {
  try {
      const transactionId = req.body.transactionId; // Get the transaction ID from the request body
      const transaction = await Transaction.findById(transactionId); // Find the transaction by its ID

      if (!transaction) {
          res.status(404).send('Transaction not found');
          return;
      }

      if (transaction.status === 'Reserved') {
          transaction.status = 'Borrowed'; // Update the status
          await transaction.save(); // Save the transaction
          res.status(200).send('Transaction status updated successfully');
      } else {
          res.status(400).send('Transaction is not in Reserved status');
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
};

// Show all reservations of the user
module.exports.userReservations_get = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
        if (err) {
          console.error(err.message);
          next();
        } else {
          console.log(decodedToken);
          const userDetails = await User.findById(decodedToken.id).populate('activeTransactions').populate('prevTransactions').exec();
          if (!userDetails) {
            console.error('User not found:', userDetails._id);
            return res.status(404).json({ success: false, message: 'User not found' });
          }
          const transactions = await Transaction.find();

              await Promise.all(transactions.map(async (transaction) => {
                if ((transaction.returnDate < Date.now() && transaction.status == 'Reserved') || (transaction.returnDate < Date.now() && transaction.status == 'Overdue')) {
                  await Transaction.findByIdAndUpdate(
                    transaction._id, 
                    { 
                      $set: { 
                        status: 'Overdue',
                        fine: 1000 * Math.floor((Date.now() - new Date(transaction.returnDate)) / (1000 * 60 * 60 * 24))
                      }
                    },
                    { new: true },
                  );
                }
              }));
          const allActiveTransactions = await Promise.all(
            userDetails.activeTransactions.map(async (transaction) => {
              if (!transaction) {
                console.error('Transaction not found');
                return;
              }

              const book = await getBookById(transaction.bookId);
              return {
                bookTitle: book.title,
                status: transaction.status,
                pickUpDate: transaction.pickUpDate,
                returnDate: transaction.returnDate,
                fine: transaction.fine,
              };
            })
          );

          const allPrevTransactions = await Promise.all(
            userDetails.prevTransactions.map(async (transaction) => {
              if (!transaction) {
                console.error('Transaction not found');
                return;
              }

              const book = await getBookById(transaction.bookId);
              return {
                bookTitle: book.title,
                status: transaction.status,
                pickUpDate: transaction.pickUpDate,
                returnDate: transaction.returnDate,
                fine: transaction.fine,
              };
            })
          );

          res.render('userReservations', { allActiveTransactions, allPrevTransactions });
        }
      });
    } else {
      res.locals.user = null;
      next();
    }
  } catch (error) {
    console.error('Error processing transactions:', error);
    res.status(500).send('Internal Server Error');
  }
};
const mongoose = require('mongoose');