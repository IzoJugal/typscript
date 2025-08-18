import mongoose, { Document, Schema, model, Types } from "mongoose";
import { IUser } from "./AuthModel";

interface Image {
  url: string;
}

interface ActivityLog {
  action:
    | "created"
    | "assigned"
    | "in-progress"
    | "picked-up"
    | "donated"
    | "processed"
    | "recycled"
    | "cancelled";
  by?: Types.ObjectId | IUser;
  note?: string;
  timestamp?: Date;
}

export interface IDonation extends Document {
  donor: Types.ObjectId | IUser;
  scrapType: string;
  phone: string;
  description: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: number;
  city?: string;
  country?: string;
  pickupDate: Date;
  pickupTime: string;
  images: Image[];
  status:
    | "pending"
    | "assigned"
    | "in-progress"
    | "picked-up"
    | "donated"
    | "processed"
    | "recycled"
    | "cancelled";
  notes?: string;
  activityLog: ActivityLog[];
  dealer?: Types.ObjectId | IUser;
  recycler?: Types.ObjectId | IUser;
  weight?: number;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<Image>(
  {
    url: { type: String, required: true },
  },
  { _id: false }
);

const activityLogSchema = new Schema<ActivityLog>(
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
    by: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const donationSchema = new Schema<IDonation>(
  {
    donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scrapType: { type: String, required: true, min: 3 },
    phone: {
      type: String,
      trim: true,
      required: true,
      match: [/^\d{7,15}$/, "Invalid phone number"],
    },
    description: { type: String, trim: true, required: true, maxlength: 500 },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    pincode: { type: Number },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    pickupDate: { type: Date, required: true },
    pickupTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) =>
          /^([0-9]{1,2}:[0-9]{2} (AM|PM))$/.test(v) ||
          /^([0-9]{1,2}:[0-9]{2} (AM|PM)) - ([0-9]{1,2}:[0-9]{2} (AM|PM))$/.test(
            v
          ),
        message: (props: any) => `${props.value} is not a valid pickup time format`,
      },
    },
    images: [imageSchema],
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
    notes: { type: String, trim: true, maxlength: 500 },
    activityLog: [activityLogSchema],
    dealer: { type: Schema.Types.ObjectId, ref: "User" },
    recycler: { type: Schema.Types.ObjectId, ref: "User" },
    weight: { type: Number, min: 0 },
    price: { type: Number, min: 0 },
  },
  {
    timestamps: true,
  }
);

const Donation = model<IDonation>("Donation", donationSchema);

export default Donation;
