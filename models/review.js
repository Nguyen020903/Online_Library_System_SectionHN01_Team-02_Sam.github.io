const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'book'},
        review: { type: String, required: [true, 'Review need to be filled']},
        star: { type: Number, required: [true, 'Star need to be filled'], min: 1, max: 5},
        type: { type: String, required: [true, 'Type need to be filled'], enum: ['For_Book', 'For_Library']}
    },
    {
        timestamps: true,
    }
);

const Review = mongoose.model("review", reviewSchema);
module.exports = Review;