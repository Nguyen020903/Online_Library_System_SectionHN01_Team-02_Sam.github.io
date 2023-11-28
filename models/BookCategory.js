const mongoose = require('mongoose');

const bookCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      unique: true,
    },
    books: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const BookCategory = mongoose.model("BookCategory", bookCategorySchema);
module.exports = BookCategory;
