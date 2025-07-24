const mongoose = require("mongoose");

const impactSchema = new mongoose.Schema({      
  count: String,       
  label: String,       
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Impact", impactSchema);
