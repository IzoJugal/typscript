import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  id: number;
  name: string;
  email: string;
}

const userSchema: Schema = new Schema<IUser>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
