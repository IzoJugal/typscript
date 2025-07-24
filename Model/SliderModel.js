const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema({
  images: [
    {
      url: String,
      public_id: String,
      title: String,
      description: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Image", sliderSchema);
