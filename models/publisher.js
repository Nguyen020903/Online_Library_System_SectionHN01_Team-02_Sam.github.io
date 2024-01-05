const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name need to be filled'], unique: true},
        book: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book'}]
    },
    {
        timestamps: true,
    }
);

const Publisher = mongoose.model("publisher", publisherSchema);
module.exports = Publisher;