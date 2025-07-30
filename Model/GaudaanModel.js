const mongoose = require("mongoose");

const gaudaanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Invalid phone number"],
    },
    address: { type: String, required: true },
    pickupDate: { type: String, required: true },
    pickupTime: { type: String, required: true },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
      },
    ],
    governmentId: { type: String, default: "" },
    animalRegisteredId: { type: String, default: "", required: true },
    animalType: {
      type: String,
      enum: ["cow", "buffalo", "other"],
      required: true,
    },
    animalCondition: {
      type: String,
      enum: ["healthy", "sick", "injured"],
      default: "healthy",
    },
    animalDescription: { type: String, default: "" },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "unassigned",
        "assigned",
        "picked_up",
        "shelter",
        "dropped",
        "rejected",
      ],
      default: "unassigned",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "unassigned",
            "assigned",
            "picked_up",
            "shelter",
            "dropped",
            "rejected",
          ],
        },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: { type: String, default: "" },
    consent: { type: Boolean, required: true },
  },
  { timestamps: true }
);

gaudaanSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Gaudaan", gaudaanSchema);
