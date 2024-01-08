// Import necessary modules
const User = require('../models/user');
const Book = require('../models/book');
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getUserById, getBookById } = require('../middleware/nameMiddleware');


// ----------------------------------Wishlist---------------------------------------- //

// Controller to get user's wishlist
module.exports.wishlistGet = async (req, res) => {
  let user = res.locals.user;
  let books = [];

  // If user exists, fetch their favorite books
  if (user) {
    try {
      books = await Book.find({ _id: { $in: user.favoriteBook } })
        .populate('author') // populate author details
        .populate('category') // populate category details
        .exec();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching the user\'s favorite books' });
    }
  }

  // Render the wishlist page with user and books data
  res.render('wishlist', { user, books });
}

// Controller to add a book to user's wishlist
module.exports.addToWishlistPost = async (req, res) => {
  const { bookId } = req.body;
  let user = res.locals.user;

  // If user exists, add the book to their wishlist
  if (user) {
    try {
      const book = await Book.findById(bookId);

      if (book) {
        user.favoriteBook.push(bookId); // Add the book_id to the user's favoriteBook array
        await user.save(); // Save the updated user
        res.status(200).json({ message: 'Book added to wishlist successfully' }); // Send a success response
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while adding the book to the cart' });
    }
  }

  res.status(200).end(); // Send a 200 OK response
};

// Controller to remove a book from user's wishlist
module.exports.removeFromWishlistPost = async (req, res) => {
  const { bookId } = req.body;
  let user = res.locals.user;

  // If user exists, remove the book from their wishlist
  if (user) {
    try {
      const book = await Book.findById(bookId);

      if (book) {
        user.favoriteBook.pull(bookId); // Remove the book_id from the user's favoriteBook array
        await user.save(); // Save the updated user
        res.status(200).json({ message: 'Book removed from wishlist successfully' }); // Send a success response
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while removing the book from the wishlist' });
    }
  } else {
    res.status(401).json({ error: 'User not authenticated' }); // Handle case where user is not authenticated
  }
};

// Controller to clear user's wishlist
module.exports.clearWishlistPost = async (req, res) => {
  let user = res.locals.user;

  try {
    if (!user) {
      return res.status(404).send('User not found'); // Handle case where user is not found
    }

    user.favoriteBook = []; // Clear the user's favoriteBook array
    await user.save(); // Save the user
    res.redirect('/myAccount'); // Redirect back to the myAccount page
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error'); // Handle server errors
  }
};


// ----------------------------------Reservation---------------------------------------- //

// Create reservation
module.exports.createReservationGet = async (req, res) => {
  const users = await User.find();
  const books = await Book.find();

  res.render('createReservation', { users, books });
}

module.exports.createReservationPost = async (req, res) => {
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
        status = 'Pending';
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

module.exports.reservationGet = async (req, res) => {
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

// Controller to get all reservations
module.exports.reservationGet = async (req, res) => {
  try {
    // Fetch transactions from the database
    const transactions = await Transaction.find();

    // Update transaction status and fine if overdue
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

// Controller to handle reservation of all books
module.exports.reserveAllPost = async (req, res) => {
  await reserveBooks(req, res);
};

// Controller to handle reservation of selected books
module.exports.reserveSelectedPost = async (req, res) => {
  await reserveBooks(req, res);
};

// Function to reserve books
async function reserveBooks(req, res) {
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
          status = "Pending";
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
}

// This function handles the POST request to return a reservation
module.exports.reservationsReturnPost = async (req, res) => {
  try {
    // Extract the id from the request body
    const id = req.body.id;

    // Validate the id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid id:', id);
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    // Update the transaction status to 'Returned'
    const transaction = await Transaction.findByIdAndUpdate(id, { status: 'Returned' }, { new: true });

    // Check if the transaction exists
    if (!transaction) {
      console.error('Transaction not found:', id);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Remove the transaction from the book's transactions
    const book = await Book.findByIdAndUpdate(transaction.bookId,{ $pull: { transactions: id } },{ new: true });

    // Check if the book exists
    if (!book) {
      console.error('Book not found:', transaction.bookId);
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Increase the book's bookCountAvailable by 1 and set the bookStatus to 'Available'
    const bookStatus = await Book.findByIdAndUpdate(
      transaction.bookId,
      {
        $inc: { bookCountAvailable: 1 },
        $set: { bookStatus: 'Available' }
      },
      { new: true }
    );

    // Move the transaction from the user's activeTransactions to prevTransactions
    const user = await User.findByIdAndUpdate(transaction.userId, { $pull: { activeTransactions: id }, $push: { prevTransactions: id } }, { new: true });

    // Check if the user exists
    if (!user) {
      console.error('User not found:', transaction.userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send a success response
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false });
  }
};

// This function handles the POST request to update a reservation status from 'Reserved' to 'Borrowed'
module.exports.reservationsBorrowedPost = async (req, res) => {
  try {
    // Extract the transaction ID from the request body
    const transactionId = req.body.transactionId;

    // Find the transaction by its ID
    const transaction = await Transaction.findById(transactionId);

    // If the transaction doesn't exist, send a 404 response
    if (!transaction) {
      res.status(404).send('Transaction not found');
      return;
    }

    // If the transaction status is 'Reserved', update it to 'Borrowed'
    if (transaction.status === 'Pending') {
      transaction.status = 'Borrowed';
      await transaction.save(); // Save the updated transaction
      res.status(200).send('Transaction status updated successfully');
    } else {
      // If the transaction status is not 'Reserved', send a 400 response
      res.status(400).send('Transaction is not in Reserved status');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// This function handles the GET request to show all reservations of a user
module.exports.userReservationGet = async (req, res, next) => {
  try {
    // Extract the JWT token from the cookies
    const token = req.cookies.jwt;

    // If the token exists, verify it
    if (token) {
      jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
        if (err) {
          console.error(err.message);
          next();
        } else {
          // Find the user details by the decoded token ID
          const userDetails = await User.findById(decodedToken.id).populate('activeTransactions').populate('prevTransactions').exec();

          // If the user doesn't exist, send a 404 response
          if (!userDetails) {
            console.error('User not found:', userDetails._id);
            return res.status(404).json({ success: false, message: 'User not found' });
          }

          // Find all transactions
          const transactions = await Transaction.find();

          // Update the status and fine of overdue transactions
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

          // Get all active transactions of the user
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

          // Get all previous transactions of the user
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

          // Render the 'userReservations' view with the active and previous transactions
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