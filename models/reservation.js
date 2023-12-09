const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        memberID: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: [true, 'Name need to be filled'], 
            ref: 'user'},
        bookID: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            required: [true, 'Book need to be filled'], 
            ref: 'book'}],
        status: {
            type: String,
            default: 'Pending',
            enum: ['Available', 'Reserved', 'Overdue', 'Pending'],
        },
        pickUpDate: {
            type: Date,
            required: [true, 'Pick up date need to be filled']
        },
        fine: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true,
    }
)

const Reservation = mongoose.model("reservation", reservationSchema);
module.exports = Reservation;