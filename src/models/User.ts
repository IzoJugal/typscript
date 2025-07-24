import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
}

const userSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
