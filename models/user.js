const mongoose = require('mongoose');
const { isEmail } = require('validator');

const userSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: ['Manager','Reader'],
        require: true
    },
    userFullName: {
        type: String,
        require: [true, 'Please enter your full name']
    },
    email: {
        type: String,
        require: [true, 'Please enter your email'],
        max: 50,
        unique: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        require: [true, 'Please enter your password'],
        minlength: [6, 'Minimum password length is 6 characters']
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

userSchema.post('save', function (doc, next) {
    console.log('New User was created & saved', doc);
    next();
});

userSchema.pre('save', function (next) {
    console.log('User about to be created and save', this);
    next();
});


// Define a model based on the schema
const User = mongoose.model('User', userSchema);

// the module exports the "Product" model so that it can be used by other parts of the application.
module.exports = User;