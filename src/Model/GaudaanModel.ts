import mongoose, { Document, Schema, Types, model } from "mongoose";

interface Image {
  url: string;
}

interface StatusHistory {
  status: 
    | "unassigned"
    | "assigned"
    | "picked_up"
    | "shelter"
    | "dropped"
    | "rejected";
  changedBy?: Types.ObjectId;
  timestamp?: Date;
}

export interface IGaudaan extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  pickupDate: string;
  pickupTime: string;
  images: Image[];
  governmentId?: string;
  animalRegisteredId: string;
  animalType: "cow" | "buffalo" | "other";
  animalCondition?: "healthy" | "sick" | "injured";
  animalDescription?: string;
  assignedVolunteer?: Types.ObjectId | null;
  shelterId?: Types.ObjectId | null;
  status: "unassigned" | "assigned" | "picked_up" | "shelter" | "dropped" | "rejected";
  rejectionReason?: string;
  statusHistory: StatusHistory[];
  donor: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId | null;
  notes?: string;
  consent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<Image>(
  {
    url: { type: String, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema<StatusHistory>(
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
      required: true,
    },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const gaudaanSchema = new Schema<IGaudaan>(
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
    images: [imageSchema],
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
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    shelterId: {
      type: Schema.Types.ObjectId,
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
    rejectionReason: {
      type: String,
      default: "",
    },
    statusHistory: [statusHistorySchema],
    donor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: { type: String, default: "" },
    consent: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const Gaudaan = model<IGaudaan>("Gaudaan", gaudaanSchema);

export default Gaudaan;
