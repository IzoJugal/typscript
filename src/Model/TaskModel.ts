import { Schema, model, Document, Types } from "mongoose";
import {IUser} from "./AuthModel";
// Enum types for status fields
export type VolunteerStatus = 'pending' | 'accepted' | 'rejected';
export type TaskStatus = 'pending' | 'active' | 'completed' | 'cancelled';

// Embedded subdocument for volunteers
interface IVolunteerEntry {
  user: Types.ObjectId | IUser;
  status: VolunteerStatus;
}

// Interface for the VolunteerTask document
export interface ITask extends Document {
  taskTitle: string;
  taskType: string;
  description: string;
  date: Date;
  time: string;
  volunteers: IVolunteerEntry[];
  address?: string;
  status: TaskStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const TaskSchema = new Schema<ITask>(
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
        validator: function (v: string) {
          return /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?\d|2[0-3]):[0-5]\d$/i.test(
            v
          );
        },
        message: (props: any) => `${props.value} is not a valid time format!`,
      },
    },
    volunteers: [
      {
        user: {
          type: Schema.Types.ObjectId,
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

// Export the model
const Task = model<ITask>("VolunteerTask", TaskSchema);

export default Task;
