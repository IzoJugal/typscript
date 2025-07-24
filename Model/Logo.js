// models/Logo.js
const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema({
  url: String,
  title: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Logo", logoSchema);
