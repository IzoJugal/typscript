const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema({
  filename: { type: String, required: true }, // Filename for the logo in GridFS
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to the GridFS file ID
  title: { type: String, default: "Logo" }, // Title of the logo
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Logo", logoSchema);
