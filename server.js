const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());

const PORT = process.env.PORT || 5000;

// Routes
app.use("/", require("./routes/index.js"));

// app.use((req, res, next) => {
//   console.log(`Incoming Request: ${req.method} ${req.url}`);
//   next();
// });

app.use("/", (req, res) => {
  try {
    console.log("Welcome to the recipe management application.");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server.js error", err: error.message });
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, (req, res) => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
