import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();
const User = require("./models/user");

/* User Registration */

router.post("/register", async (req, res) => {
    try {
      /* Salting and Hashing the Password */
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(req.body.password, salt);
  
      /* Create a new user */
      const newUser = new User({
        userType: req.body.userType,
        userFullName: req.body.fullName,
        email: req.body.email,
        password: hashedPass, // Save the hashed password
        isAdmin: req.body.isAdmin,
      });
  
      /* Save User and Return */
      newUser.save()
        .then(() => res.status(200).json({ message: 'User registered successfully' }))
        .catch((error) => res.status(500).json({ error: error.message }));
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

/* User Login */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username, password });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPass = await bcrypt.compare(password, user.password);

    if (!validPass) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
