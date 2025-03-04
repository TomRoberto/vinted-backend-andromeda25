const express = require("express");
const router = express.Router();
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

router.post("/user/signup", async (req, res) => {
  try {
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // Vérifier qu'il n'existe pas déjà en BDD un user avec ce mail
    // Je vais chercher dans ma BDD, dans la collection User s'il existe un user dont la clef email vaut req.body.email
    const existingUser = await User.findOne({ email: req.body.email });
    // console.log(userExist);

    if (existingUser) {
      return res.status(409).json({ message: "This email is already used" });
    }

    // console.log(req.body);
    const token = uid2(64);
    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newHash = SHA256(req.body.password + user.salt).toString(encBase64);

    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      _id: user._id,
      token: user.token,
      account: {
        username: user.account.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
