const mongoose = require("mongoose");

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    profileImage: { type: String, default: "" },
    address: { type: String, required: true },
    capacity: { type: Number },
    isActive: { type: Boolean, default: true },
    currentOccupancy: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shelter", shelterSchema);
