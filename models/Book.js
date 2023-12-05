const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    ISBN: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      require: true,
    },
    publisher: {
      type: String,
      required: true,
    },
    numberOfPages: {
        type: Number,
        required: true,
    },
    bookCountAvailable: {
      type: Number,
      require: true,
    },
    bookStatus: {
      type: String,
      default: "Available",
      enum: ['Available', 'Borrowed'],
    },
    categories: [
      {
        type: mongoose.Types.ObjectId,
        ref: "BookCategory",
      },
    ],
    transactions: [
      {
        type: mongoose.Types.ObjectId,
        ref: "BookTransaction",
      },
    ],
  },
  {
    timestamps: true,
  }
);

bookSchema.post('save', function (doc, next) {
  console.log('New book was created & saved', doc);
  next();
});

bookSchema.post('updateOne', async function (doc, next) {
  console.log('Book has been updated', doc);
  next();
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
