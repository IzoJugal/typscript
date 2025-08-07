// // models/Logo.js
// const mongoose = require("mongoose");

// const logoSchema = new mongoose.Schema({
//   url: String,
//   title: String,
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Logo", logoSchema);

// models/Logo.js

const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true, // Filename in GridFS
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId, // ID from GridFS
    required: true,
    unique: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Logo", logoSchema);
