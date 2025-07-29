// models/donation.model.js
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scrapType: {
      type: String,
      required: true,
      min: 3,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      match: [/^\d{7,15}$/, "Invalid phone number"],
    },
    description: {
      type: String,
      trim: true,
      required: true,
      maxlength: 500,
    },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    pincode: { type: Number, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    pickupDate: {
      type: Date,
      required: true,
    },
    pickupTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          // Accept either "10:00 AM" or "10:00 AM - 12:00 PM"
          return (
            /^([0-9]{1,2}:[0-9]{2} (AM|PM))$/.test(v) ||
            /^([0-9]{1,2}:[0-9]{2} (AM|PM)) - ([0-9]{1,2}:[0-9]{2} (AM|PM))$/.test(
              v
            )
          );
        },
        message: (props) => `${props.value} is not a valid pickup time format`,
      },
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in-progress",
        "picked-up",
        "donated",
        "processed",
        "recycled",
        "cancelled",
      ],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      required: false,
      maxlength: 500,
    },
    activityLog: [
      {
        action: {
          type: String,
          enum: [
            "created",
            "assigned",
            "in-progress",
            "picked-up",
            "donated",
            "processed",
            "recycled",
            "cancelled",
          ],
          required: true,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        note: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    recycler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    weight: {
      type: Number,
      required: false,
      min: 0,
    },
    price: {
      type: Number,
      required: false,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
