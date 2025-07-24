const mongoose = require("mongoose");

const gaudaanSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  pickupDate: String,
  pickupTime: String,
  location: {
    lat: Number,
    lng: Number,
  },
  images: [String],
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    default: null,
  },  status: {
    type: String,
    enum: ["unassigned", "assigned", "picked_up", "shelter", "dropped"],
    default: "unassigned",
  },
}, {
  timestamps: true, 
});

module.exports = mongoose.model("Gaudaan", gaudaanSchema);
