const User = require('../models/user');

module.exports.myaccount_get = async (req, res) => {
    let user = res.locals.user;
    res.render('myAccount', {user});
}