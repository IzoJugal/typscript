const mongoose = require("mongoose");

const volunteerTaskSchema = new mongoose.Schema(
  {
    taskTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    taskType: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // e.g., "10:00 AM"
      required: true,
      validate: {
        validator: function (v) {
          return /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?\d|2[0-3]):[0-5]\d$/i.test(
            v
          );
        },
        message: (props) => `${props.value} is not a valid time format!`,
      },
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assuming volunteer is a user
      required: false,
    },
    address: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const VolunteerTask = mongoose.model("VolunteerTask", volunteerTaskSchema);

module.exports = VolunteerTask;
