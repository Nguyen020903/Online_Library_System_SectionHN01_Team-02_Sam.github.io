const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name need to be filled'], unique: true},
        book: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book'}]
    },
    {
        timestamps: true,
    }
);

const Author = mongoose.model("author", authorSchema);
module.exports = Author;