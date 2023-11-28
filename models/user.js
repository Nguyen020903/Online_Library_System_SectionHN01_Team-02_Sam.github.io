const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: ['Manager','Reader'],
        require: true
    },
    userFullName: {
        type: String,
        require: true,
        unique: true
    },
    email: {
        type: String,
        require: true,
        max: 50,
        unique: true
    },
    password: {
        type: String,
        require: true,
        min: 6
    },
    totalBookCheckedOut: {
        type: Number,
        default: 0,
    },
    points: {
        type: Number,
        default: 0
    },
    activeTransactions: [{
        type: mongoose.Types.ObjectId,
        ref: "BookTransaction"
    }],
    prevTransactions: [{
        type: mongoose.Types.ObjectId,
        ref: "BookTransaction"
    }],
    favoriteBook: [{
        type: mongoose.Types.ObjectId,
        ref: "Book",
    }],
    isAdmin: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
});


// Define a model based on the schema
const User = mongoose.model('User', userSchema);

// the module exports the "Product" model so that it can be used by other parts of the application.
module.exports = User;