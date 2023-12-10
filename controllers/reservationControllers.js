const User = require('../models/user');

module.exports.add_to_cart_post = (req, res) => {
    const book_id = req.body.book_id;
  
    if (!req.session.cart) {
      req.session.cart = [];
    }
  
    let count = 0;
    for (let i = 0; i < req.session.cart.length; i++) {
      if (req.session.cart[i].product_id === product_id) {
        req.session.cart[i].quantity += 1;
        count++;
      }
    }
    if (count === 0) {
      const cart_data = {
        book_id: book_id,
        quantity: 1
      };
      req.session.cart.push(cart_data);
    }
};
  