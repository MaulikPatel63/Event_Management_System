const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const bcryptjs = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const image = req.file ? req.file.filename : null;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingUserByUsername = await User.findOne({ username: username });

    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    // Create user
    user = new User({
      username,
      email,
      password: hashedPassword,
      image: image,
    });

    await user.save();
    const token = jwt.sign({ userId: user }, process.env.JWT_SECRET, {
      expiresIn: "7day",
    });
    res.status(201).json({
      message: "user successfully register",
      user: user,
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", err: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user }, process.env.JWT_SECRET, {
      expiresIn: "7day",
    });

    res.status(200).json({
      message: "user successfully login",
      data: user,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set reset token and expiration
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email
    const resetUrl = `http://yourfrontend.com/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: message,
    });

    res
      .status(200)
      .json({ message: "Password reset email sent", resetToken: resetToken });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by token and check expiration
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    // Set new password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const authCheck = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.log("Error in authCheck controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  authCheck,
};
