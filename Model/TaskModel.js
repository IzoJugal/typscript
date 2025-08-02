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
      trim: true,
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
      type: String,
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
    volunteers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    address: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const VolunteerTask = mongoose.model("VolunteerTask", volunteerTaskSchema);

module.exports = VolunteerTask;
