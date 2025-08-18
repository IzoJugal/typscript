import mongoose, { Document, Schema, Types, model } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  message: string;
  isRead?: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false } 
);

const Notification = model<INotification>("Notification", notificationSchema)

export default Notification;
