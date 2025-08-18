// src/Model/AuthModel.ts
import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface IUser extends Document {
  userId: string;
  uid: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isProfileComplete: Boolean;
  otp?: string;
  otpExpires?: Date;
  roles: Array<'user' | 'volunteer' | 'admin' | 'dealer' | 'recycler'>;
  profileImage?: string;
  isActive: boolean;
  notificationsEnabled: boolean;
  fcmTokens?: string[];
  generateToken(): string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, },
    lastName: { type: String, },
    phone: { type: String, },
    email: { type: String, required: true, unique: true },
    password: { type: String, },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isProfileComplete: { type: Boolean, default: false },
    roles: {
      type: [String],
      enum: ['user', 'volunteer', 'admin', 'dealer', 'recycler'],
      default: ['user'],
      validate: {
        validator(roles): boolean {
          if ((roles.includes('admin') || roles.includes('dealer')) && roles.length > 1) {
            return false;
          }
          return true;
        },
        message: 'Admin or Dealer role must not be combined with other roles',
      },
    },
    profileImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    uid: { type: String, unique: true },
    notificationsEnabled: { type: Boolean, default: true },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate Token
userSchema.methods.generateToken = function (): string {
  const secret = process.env.JWT_SECRET;
  const expiresInEnv = process.env.JWT_EXPIRES_IN;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env');
  }

  const payload = {
    userId: this._id.toString(),
    email: this.email,
    roles: this.roles,
  };

  const options: SignOptions = {
    expiresIn:
      typeof expiresInEnv === 'string' || typeof expiresInEnv === 'number'
        ? expiresInEnv
        : ('1h' as any),
  };

  return jwt.sign(payload, secret, options);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export const Admin: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default { User, Admin };