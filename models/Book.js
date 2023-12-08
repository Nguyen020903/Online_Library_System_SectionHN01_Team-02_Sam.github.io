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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'publisher'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'author'
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
    category: 
      {
        type: mongoose.Types.ObjectId,
        ref: "BookCategory",
      },
    transactions: [
      {
        type: mongoose.Types.ObjectId,
        ref: "BookTransaction",
      },
    ],
    description: {
      type: String
    },
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
