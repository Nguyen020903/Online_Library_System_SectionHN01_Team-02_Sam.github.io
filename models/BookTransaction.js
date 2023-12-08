const mongoose = require('mongoose');

const bookTransactionSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "book",
        require: true,
    },
    borrowerId: { //EmployeeId or AdmissionId
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user",
        require: true,
    },
    transactionType: { //Issue or Reservation
        type: String,
        require: true,
    },
    fromDate: {
        type: String,
        require: true,
    },
    toDate: {
        type: String,
        require: true,
    },
    returnDate: {
        type: String,
    },
    transactionStatus: {
        type: String,
        default: "Active",
        enum: ['Active', 'Inactive'],
    }
},
    {
        timestamps: true
    }
);

const BookTransaction = mongoose.model("BookTransaction", bookTransactionSchema);
module.exports = BookTransaction;