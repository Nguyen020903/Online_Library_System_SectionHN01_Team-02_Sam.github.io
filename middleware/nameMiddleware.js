const User = require('../models/user'); // Adjust the path as needed
const Book = require('../models/book'); // Adjust the path as needed

const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

const getBookById = async (bookId) => {
  try {
    const book = await Book.findById(bookId);
    return book;
  } catch (error) {
    console.error('Error fetching book:', error);
    throw error;
  }
};

module.exports = { getUserById, getBookById };