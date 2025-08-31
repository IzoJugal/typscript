// src/controller/AuthController.ts
import { Request, Response } from 'express';
import https from 'https';
import axios, { AxiosResponse } from "axios";
import mongoose, { Error, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { Socket } from 'socket.io';
import { getIO } from '../config/socket';
import { IUser, User, Session } from "../Model/AuthModel";
import Donation from "../Model/DonationModel";
import VolunteerTask from "../Model/TaskModel";
import Slider from "../Model/SliderModel";
import Logo from "../Model/Logo";
import Gaudaan, { IGaudaan } from "../Model/GaudaanModel";
import Shelter from "../Model/ShelterModel";
import Notification from "../Model/NotificationsModel";
import Impact from "../Model/Impact";
import msg91 from 'msg91';
import admin from "../config/FirebaseAdmin";
import { error, log } from 'console';

let gfs: mongoose.mongo.GridFSBucket;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
    bucketName: 'uploads',
  });
});

interface AuthRequest extends Request {
  user?: { userId: string; roles: string[], _id: string; };
  files?: { [fieldname: string]: Express.Multer.File[] };
  io?: Socket;
}

interface VolunteerSignupBody {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  otp: string;
  method: string;
}

interface SignupBody extends VolunteerSignupBody {
  roles?: string | string[];
  accessToken: string;
}

interface SendOTPBody {
  email: string;
  phone: string;
  method: string;
}

interface SignInBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  newPassword: string;
}

interface FCMTokenBody {
  fcmToken: string;
  deviceId?: string;
}

interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notificationsEnabled?: boolean | string;
  profileImage?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

interface CreateDonationBody {
  scrapType: string;
  phone: string;
  description: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  city: string;
  country: string;
  pickupDate: string;
  pickupTime: string;
  district: string;
  images?: string | { url: string }[];
}

interface LogoutRequest extends Request {
  user?: { userId: string };
  headers: {
    authorization?: string;
  };
}
interface UpdateDonationStatusBody {
  status: string;
  note?: string;
}

const dealerUpdatableStatuses = ['in-progress', 'picked-up'] as const;
type DealerUpdatableStatus = typeof dealerUpdatableStatuses[number];

interface AddPriceAndWeightBody {
  price: number;
  weight: number;
  notes?: string;
}

interface UpdateTaskStatusBody {
  action: 'accept' | 'reject';
}

interface GaudaanFormBody {
  name: string;
  email: string;
  phone: string;
  address: string;
  pickupDate: string;
  pickupTime: string;
  governmentId?: string;
  animalRegisteredId?: string;
  animalType: string;
  animalCondition?: string;
  animalDescription?: string;
  consent: boolean | string;
}

interface UpdateGaudaanStatusBody {
  status: string;
  shelterId?: string;
}

interface AssignRecyclerBody {
  recyclerId: string;
}


// Volunteer Signup
const volunteerSignup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { firstName, lastName, phone, email, password, otp, method } = req.body as VolunteerSignupBody;

  // Input validation
  if (!firstName) {
    res.status(400).json({ message: 'Missing First Name' });
    return;
  } if (!lastName) {
    res.status(400).json({ message: 'Missing Last Name' });
    return;
  } if (!email) {
    res.status(400).json({ message: 'Missing Email' });
    return;
  } if (!phone) {
    res.status(400).json({ message: 'Missing Phone Number' });
    return;
  } if (!password) {
    res.status(400).json({ message: 'Missing Password' });
    return;
  } if (!otp || !method) {
    res.status(400).json({ message: 'OTP and method required' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    // if (existingUser) {
    //   res.status(400).json({ message: 'Email or phone already in use' });
    //   return;
    // }

    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      email: normalizedEmail,
      password,
      roles: ['volunteer'],
      isProfileComplete: true,
    });

    const payload = {
      userId: newUser._id,
      email: newUser.email,
      roles: newUser.roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: '1h',
    });

    res.status(200).json({
      success: true,
      message: 'Volunteer registered successfully',
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        email: newUser.email,
        roles: newUser.roles
      },
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: (err as Error).message,
    });
  }
};

// SEND OTP VIA MSG91
// Verify OTP Controller
const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { widgetId, reqId, otp } = req.body;

  if (!widgetId || !reqId || !otp) {
    res.status(400).json({ success: false, message: "widgetId, reqId, and otp are required" });
    return;
  }

  try {
    const response = await axios.post(
      "https://api.msg91.com/api/v5/widget/verifyOtp",
      { widgetId, reqId, otp },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY || "your-authkey-here",
          "content-type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log("MSG91 Verify Response:", data);

    if (data.type === "success" || data.success) {
      // ✅ Generate JWT token for signup
      const token = jwt.sign(
        { reqId, otpVerified: true },
        process.env.JWT_SECRET || "supersecret",
        { expiresIn: "10m" } // OTP validity only for signup, short-lived
      );

      res.json({
        success: true,
        message: data.message || "OTP verified successfully",
        token,
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.message || "Invalid OTP",
      });
    }
  } catch (error: any) {
    console.error("MSG91 verifyOtp error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || "Failed to verify OTP",
    });
  }
};

// Send OTP Controller
const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { widgetId, identifier } = req.body;

  if (!widgetId || !identifier) {
    res.status(400).json({ success: false, message: "widgetId and identifier are required" });
    return;
  }

  // Normalize identifier: if it's a phone number without country code, prepend 91
  let normalizedIdentifier = identifier;
  if (/^\d{10}$/.test(identifier)) {
    // If it's exactly 10 digits, assume Indian mobile number
    normalizedIdentifier = "91" + identifier;
  }

  try {
    const response = await axios.post(
      "https://api.msg91.com/api/v5/widget/sendOtp",
      { widgetId, identifier: normalizedIdentifier },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY || "your-widget-authkey",
          "content-type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log("MSG91 Response:", data);

    if (data.type === "success") {
      // Normalize reqId (sometimes comes in "message" field)
      const reqId = data.reqId || data.message;

      res.json({
        success: true,
        reqId,
        message: "OTP sent successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.message || "Failed to send OTP",
      });
    }
  } catch (error: any) {
    console.error("MSG91 sendOtp error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: error.response?.data?.message || "Failed to send OTP",
    });
  }
};

// Retry OTP Controller
const retryOtp = async (req: Request, res: Response): Promise<void> => {
  const { widgetId, reqId } = req.body;

  if (!widgetId || !reqId) {
    res.status(400).json({ success: false, message: "widgetId and reqId are required" });
    return;
  }

  try {
    const { data } = await axios.post(
      "https://api.msg91.com/api/v5/widget/retryOtp",
      { widgetId, reqId },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY || "your-widget-authkey",
          "Content-Type": "application/json",
        },
      }
    );

    // Forward MSG91 success as success
    if (data.type === "success" || data.success) {
      res.status(200).json({ success: true, message: data.message || "OTP resent" });
    } else {
      res.status(400).json({ success: false, message: data.message || "Failed to resend OTP" });
    }
  } catch (err: any) {
    console.error("MSG91 Retry OTP error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || "Failed to resend OTP",
    });
  }
};


// User Signup
const signUpAuth = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No OTP token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "supersecret");

    if (!decoded.otpVerified || !decoded.reqId) {
      res.status(403).json({ success: false, message: "OTP verification required" });
      return;
    }

    const { firstName, lastName, phone, email, password, roles } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      res.status(400).json({ success: false, message: "Phone or email already registered" });
      return;
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save user
    const newUser = new User({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      roles: roles || ["user"],
      isProfileComplete: true,
    });

    await newUser.save();

    // Issue login token
    const userToken = jwt.sign(
      { userId: newUser._id, email: newUser.email, roles: newUser.roles },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "1h" }
    );

    res.json({ success: true, token: userToken, user: newUser });
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(401).json({ success: false, message: "Invalid or expired OTP token" });
  }
};

// const signUpAuth = async (req: Request, res: Response): Promise<void> => {
//   const { firstName, lastName, phone, email, password, roles, accessToken } = req.body as SignupBody;

//   // Input Validation
//   if (!firstName) {
//     res.status(400).json({ success: false, message: "Missing First Name" });
//     return;
//   }
//   if (!lastName) {
//     res.status(400).json({ success: false, message: "Missing Last Name" });
//     return;
//   }
//   if (!phone || !/^\d{10}$/.test(phone)) {
//     res.status(400).json({ success: false, message: "Invalid Phone Number" });
//     return;
//   }
//   if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
//     res.status(400).json({ success: false, message: "Invalid Email" });
//     return;
//   }
//   if (!password || password.length < 6) {
//     res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
//     return;
//   }
//   if (!accessToken) {
//     console.warn("⚠️ Access token missing");
//     res.status(400).json({ success: false, message: "Access token required" });
//     return;
//   }

//   try {
//     const normalizedEmail = email.toLowerCase();

//     // Check for existing user
//     const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
//     if (existingUser) {
//       console.warn("❌ Email or phone already in use:", { email: normalizedEmail, phone });

//       res.status(400).json({ success: false, message: "Email or phone already in use" });
//       return;
//     }

//     // Verify MSG91 access token
//     console.log("🔐 Verifying OTP with MSG91...");
//     const verifyResponse = await axios.post(
//       process.env.MSG91_VERIFY_URL || "",
//       {
//         authkey: process.env.MSG91_AUTH_KEY,
//         'access-token': accessToken,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           Accept: 'application/json',
//         },
//       }
//     );
//     console.log("✅ OTP verification response:", verifyResponse.data);

//     if (verifyResponse.data.type !== "success") {
//       console.warn("❌ OTP verification failed:", verifyResponse.data);

//       res.status(400).json({ success: false, message: verifyResponse.data.message || "OTP verification failed" });
//       return;
//     }

//     // Validate roles
//     let validRoles: string[] = ["user"];
//     if (roles) {
//       const allowedRoles = ["user", "admin", "dealer", "recycler"];
//       const inputRoles = Array.isArray(roles) ? roles : [roles];
//       validRoles = inputRoles.filter((role) => allowedRoles.includes(role));
//       if (validRoles.includes("admin")) {
//         res.status(400).json({ success: false, message: "Cannot assign admin role directly" });
//         return;
//       }
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create new user
//     const newUser = await User.create({
//       firstName,
//       lastName,
//       phone,
//       email: normalizedEmail,
//       password: hashedPassword,
//       isProfileComplete: true,
//       roles: validRoles,
//     });

//     // Generate JWT
//     const payload = {
//       userId: newUser._id,
//       email: newUser.email,
//       roles: newUser.roles,
//     };

//     const token = jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret", {
//       expiresIn: "1h",
//     });

//     res.status(200).json({
//       success: true,
//       message: "User registered successfully",
//       token,
//       user: {
//         _id: newUser._id,
//         firstName: newUser.firstName,
//         lastName: newUser.lastName,
//         phone: newUser.phone,
//         email: newUser.email,
//         roles: newUser.roles,
//       },
//     });
//   } catch (err) {
//     console.error("Signup Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error during signup",
//       error: (err as Error).message,
//     });
//   }
// };

// Sign In
const signInAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  const { identifier, password, fcmToken, deviceId } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isMobile = /^[6-9]\d{9}$/.test(identifier);

    if (!isEmail && !isMobile) {
      res.status(400).json({ message: 'Invalid email or mobile number format' });
      return;
    }

    const user = await User.findOne(isEmail ? { email: identifier } : { phone: identifier });

    if (!user) {
      console.log('❌ User not found for identifier:', identifier);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password attempt for user:', user.email || user.phone);
      res.status(400).json({ message: 'Invalid password' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    // ✅ Invalidate all existing sessions for this user
    await Session.updateMany(
      { userId: String(user._id), isActive: true },
      { isActive: false }
    );
    console.log('🧹 Previous sessions invalidated.');

    // ✅ Create new session
    const session = new Session({
      userId: String(user._id),
      ipAddress,
      deviceId,
      userAgent,
      token,
      loginTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
    });

    try {
      await session.save();
      console.log('✅ New session saved. ID:', session._id);
    } catch (sessionError) {
      console.error('❌ Failed to save session:', sessionError);
      res.status(500).json({
        success: false,
        message: 'Failed to save session',
        error: (sessionError as Error).message,
      });
      return;
    }

    // ✅ Reset FCM tokens to only current one
    if (fcmToken && deviceId) {
      console.log('🔄 Resetting FCM tokens...');
      user.fcmTokens = [
        {
          token: fcmToken,
          deviceId,
          lastUpdated: new Date(),
        },
      ];
      await user.save();
      console.log('✅ FCM token stored for device:', deviceId);
    }

    console.log('✅ Sign-in successful for user:', user.email || user.phone);

    res.status(200).json({
      success: true,
      message: 'Sign-in successful',
      token,
      user: {
        id: user._id,
        roles: user.roles,
      },
      session: {
        sessionId: session._id,
        ipAddress: session.ipAddress,
        deviceId: session.deviceId,
        loginTime: session.loginTime,
      },
    });
  } catch (error) {
    console.error('❌ Sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

const logoutAuth = async (req: LogoutRequest, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    // Verify token to get userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'あなたの_jwt_secret') as { userId: string };
    const userId = decoded.userId;

    // Find and deactivate the session
    const session = await Session.findOne({ userId, token, isActive: true });

    if (!session) {
      res.status(404).json({ message: 'Session not found or already inactive' });
      return;
    }

    session.isActive = false;
    await session.save();

    console.log('✅ Session invalidated for user:', userId, 'Session ID:', session._id);

    res.status(200).json({
      success: true,
      message: 'Logout successful, session invalidated',
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: (error as Error).message,
    });
  }
};

// Forgot Password
export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Save token & expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Create reset URL
    const resetURL = `${process.env.REACT_APP_URL}/reset-password/${token}`;


    // Create transporter using SMTP relay host
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., "smtp.sendgrid.net"
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true if port is 465
      auth: {
        user: process.env.SMTP_USER, // usually your SMTP username
        pass: process.env.SMTP_PASS, // SMTP password
      },
    });

    // Send the email
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Gauabhayaranyam"',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <div style="background-color: #2d6a4f; padding: 15px 20px; color: white; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">Gauabhayaranyam</h1>
            </div>

            <div style="padding: 20px;">
              <h2 style="color: #2d6a4f;">Password Reset</h2>
              <p style="font-size: 16px; color: #333;">
                You recently requested to reset your password. Please click the button below to proceed:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" target="_blank" 
                  style="background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666;">
                If you didn’t request this, you can safely ignore this email. 
                This link will expire in <strong>1 hour</strong>.
              </p>
            </div>

            <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
              &copy; ${new Date().getFullYear()} Gauabhayaranyam. All rights reserved.
            </div>
          </div>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Reset Password
const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.params;
  const { newPassword } = req.body as ResetPasswordBody;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(404).json({ message: 'Token is invalid or expired' });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// App Password Reset
const sendOTPapp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now
    await user.save();
    console.log("OTP", user.otp)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., "smtp.sendgrid.net"
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true if port is 465
      auth: {
        user: process.env.SMTP_USER, // usually your SMTP username
        pass: process.env.SMTP_PASS, // SMTP password
      },
    });

    await transporter.sendMail({
      from: `"Gauabhayaranyam" <support@gauabhayaranyam.com>`,
      to: email,
      subject: "Your OTP Code",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2c3e50;">Your OTP Code</h2>
      <p style="font-size: 16px; color: #333;">Use the following One-Time Password (OTP) to continue:</p>
      <div style="font-size: 28px; font-weight: bold; background-color: #f0f0f0; padding: 15px; text-align: center; margin: 20px 0; border-radius: 6px; letter-spacing: 3px;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #888;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
      <p style="font-size: 14px; color: #888;">If you didn’t request this code, please ignore this email.</p>
      <p style="font-size: 12px; color: #aaa; margin-top: 30px;">&copy; ${new Date().getFullYear()} Gau Abhaya Aranyam</p>
    </div>
  `,
    });


    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Send Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// OTP Verify
const otpVerify = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    console.log("OTP from DB:", user.otp, "Type:", typeof user.otp);
    console.log("OTP from Request:", otp, "Type:", typeof otp);

    if (String(user.otp) !== String(otp)) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }

    if (user.otpExpires && user.otpExpires < new Date()) {
      res.status(400).json({ success: false, message: "OTP expired" });
      return;
    }

    // Clear OTP after success
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset Password
const resetPasswordApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ success: false, message: "Email and new password are required" });
      return;
    }

    const minLength = 8;
    if (newPassword.length < minLength) {
      res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      res.status(400).json({ success: false, message: "Must include at least one uppercase letter" });
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      res.status(400).json({ success: false, message: "Must include at least one lowercase letter" });
      return;
    }
    if (!/\d/.test(newPassword)) {
      res.status(400).json({ success: false, message: "Must include at least one number" });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      res.status(400).json({ success: false, message: "Must include at least one special character" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Let Mongoose pre-save hook hash the password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch Users
const fetchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as {
      userId: string;
    };

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Get User Profile
const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Update User Profile
const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone, email, notificationsEnabled } = req.body as UpdateProfileBody;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-password -roles');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (notificationsEnabled !== undefined) {
      user.notificationsEnabled = notificationsEnabled === 'true' || notificationsEnabled === true;
    }

    if (req.files?.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];

      if (user.profileImage) {
        const oldImage = await conn.db!.collection('uploads.files').findOne({
          filename: user.profileImage,
        });
        if (oldImage) {
          await gfs.delete(new mongoose.Types.ObjectId(oldImage._id));
        }
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const uploadStream = gfs.openUploadStream(filename, {
        contentType: file.mimetype,
      });

      uploadStream.write(file.buffer);
      uploadStream.end();

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      user.profileImage = filename;
    } else if (req.body.profileImage) {
      user.profileImage = req.body.profileImage;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Profile Image
const getProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename;
    const file = await conn.db!.collection('uploads.files').findOne({ filename });

    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    const downloadStream = gfs.openDownloadStreamByName(filename);
    res.set('Content-Type', file.contentType);
    downloadStream.pipe(res);

    downloadStream.on('error', () => {
      res.status(404).json({ message: 'Error retrieving file' });
    });
  } catch (err) {
    console.error('Error retrieving file:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password
const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body as ChangePasswordBody;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: 'Both currentPassword and newPassword are required',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Assign Volunteer Role
const assignVolunteerRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || String(req.user?._id);
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.roles.includes('dealer') || user.roles.includes('admin')) {
      res.status(400).json({
        message: 'Cannot combine volunteer role with dealer or admin roles',
      });
      return;
    }

    let newlyAdded = false;
    if (!user.roles.includes('volunteer')) {
      user.roles.push('volunteer');
      await user.save();
      newlyAdded = true;
    }

    if (newlyAdded) {
      const admins = await User.find({ roles: 'admin' }, '_id notificationsEnabled');
      const adminIds = admins.map((admin) => (admin._id as Types.ObjectId).toString());
      const message = `${user.firstName || 'A user'} joined as a volunteer.`;

      const notificationPromises = adminIds.map((adminId) =>
        Notification.create({ userId: adminId, message, link: '/users' })
      );
      const createdNotifications = await Promise.all(notificationPromises);

      // Socket
      const io = getIO();

      for (let i = 0; i < admins.length; i++) {
        const adminUser = admins[i];
        if (!adminUser.notificationsEnabled) continue;

        const userIdStr = (adminUser._id as Types.ObjectId).toString();

        // SOCKET.IO push
        const sockets = await io.in(userIdStr).fetchSockets();
        sockets.forEach((socket) => {
          if (socket.data.notificationsEnabled) {
            socket.emit("newNotification", {
              userId: userIdStr,
              message,
              notificationId: String(createdNotifications[i]._id),
              link: createdNotifications[i].link,
            });
          }
        });

        const tokens = adminUser.fcmTokens?.map((item) => item.token) ?? [];

        // FIREBASE PUSH
        if (tokens.length > 0) {
          try {
            await admin.messaging().sendEachForMulticast({
              tokens, // array of tokens
              notification: {
                title: "📢 New Notification",
                body: message,
              },
              data: {
                userId: userIdStr, // ✅ Added userId
                notificationId: String(createdNotifications[i]._id),
                link: createdNotifications[i].link || "",
              },
            });
          } catch (err: unknown) {
            if (err instanceof Error) {
              console.error("FCM push error:", err.message);
            } else {
              console.error("FCM push error:", err);
            }
          }
        }
      }

    }

    res.status(200).json({
      success: true,
      message: 'Volunteer role assigned',
      user,
    });
  } catch (err) {
    console.error('Assign role error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Total Volunteers
const getTotalVolunteers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await User.countDocuments({ roles: 'volunteer' });

    res.status(200).json({
      success: true,
      message: 'Total volunteers fetched successfully',
      totalVolunteers: total,
    });
  } catch (err) {
    console.error('Error fetching total volunteers:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Total Cities
const getTotalCities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counts = await Donation.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const result = counts.reduce((acc: Record<string, number>, cur) => {
      acc[cur._id || 'Unknown'] = cur.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Donation counts fetched successfully',
      counts: result,
    });
  } catch (err) {
    console.error('Error fetching donation counts by location:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Total Scraped Weight
const getTotalScrapedWeight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Donation.aggregate([
      {
        $match: {
          status: { $in: ['picked-up', 'donated'] },
          weight: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          weightDouble: { $toDouble: '$weight' },
        },
      },
      {
        $group: {
          _id: null,
          totalWeight: { $sum: '$weightDouble' },
        },
      },
    ]);

    const totalWeight = result[0]?.totalWeight || 0;

    res.status(200).json({
      success: true,
      message: 'Total collected donation weight calculated successfully',
      totalWeight,
    });
  } catch (err) {
    console.error('Error calculating total collected donation weight:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating total weight',
      error: (err as Error).message,
    });
  }
};

// Get Impacts
const getImpacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const impacts = await Impact.find();
    res.status(200).json({
      success: true,
      message: 'Impacts fetched successfully',
      impacts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch impacts',
      error: (err as Error).message,
    });
  }
};

// Create Donation
const createDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      scrapType,
      phone,
      description,
      addressLine1,
      addressLine2,
      pincode,
      city,
      district,
      country,
      pickupDate,
      pickupTime,
      images,
    } = req.body as CreateDonationBody;

    const donor = req.user?.userId;
    if (!donor) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validate required fields
    const requiredFields = {
      scrapType,
      phone,
      description,
      addressLine1,
      pincode,
      city,
      district,
      country,
      pickupDate,
      pickupTime,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        res.status(400).json({ message: `Missing required field: ${key}` });
        return;
      }
    }

    // Validate pickupDate (must be at least 5 days in the future)
    const today = new Date();
    const minimumPickupDate = new Date();
    minimumPickupDate.setDate(today.getDate() + 5);

    const selectedPickupDate = new Date(pickupDate);
    selectedPickupDate.setHours(0, 0, 0, 0);
    minimumPickupDate.setHours(0, 0, 0, 0);

    if (selectedPickupDate < minimumPickupDate) {
      res.status(400).json({ message: "Pickup date must be at least 5 days from today" });
      return;
    }

    // Validate phone (basic 10 digit)
    if (!/^\d{10}$/.test(phone)) {
      res.status(400).json({ message: "Invalid phone number" });
      return;
    }

    // Validate pincode
    const pin = Number(pincode);
    if (isNaN(pin) || pin.toString().length !== 6) {
      res.status(400).json({ message: "Invalid pincode" });
      return;
    }

    // Handle file uploads to GridFS
    const uploadedImages: { url: string }[] = [];
    if (req.files?.images) {
      const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const file of files) {
        try {
          const stream = Readable.from(file.buffer);
          const filename = `${Date.now()}-${file.originalname}`;
          const uploadStream = gfs.openUploadStream(filename, { contentType: file.mimetype });

          await new Promise<void>((resolve, reject) => {
            stream
              .pipe(uploadStream)
              .on("finish", () => {
                uploadedImages.push({ url: `/file/${uploadStream.id}` });
                resolve();
              })
              .on("error", reject);
          });
        } catch (err) {
          console.error("GridFS upload error:", err);
          res.status(500).json({ message: "Error uploading images" });
          return;
        }
      }
    }

    // Handle URL-based images (if provided in request body)
    let urlImages: { url: string }[] = [];
    if (images) {
      try {
        const parsed = typeof images === "string" ? JSON.parse(images) : images;
        if (Array.isArray(parsed)) {
          urlImages = parsed.filter((img) => img?.url);
        }
      } catch {
        res.status(400).json({ message: "Invalid images format in body" });
        return;
      }
    }

    const allImages = [...uploadedImages, ...urlImages];
    if (allImages.length === 0) {
      res.status(400).json({ message: "At least one image is required" });
      return;
    }

    // Create donation entry
    const donation = await Donation.create({
      donor,
      scrapType,
      phone,
      description,
      addressLine1,
      addressLine2,
      pincode: pin,
      city,
      district,
      country,
      pickupDate,
      pickupTime,
      images: allImages,
      activityLog: [
        { action: "created", by: donor, note: "Donation created by donor." },
      ],
    });

    // Notify admins
    const admins = await User.find({ roles: "admin" }, "_id fcmTokens");
    const message = `New donation created: ${scrapType}`;

    const notifications = await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          message,
          link: `/pickups/${donation._id}`,
        })
      )
    );

    const io = getIO();
    const adminUsers = await User.find({ roles: "admin" }, "_id fcmTokens");

    await Promise.all(
      adminUsers.map(async (adminUser, idx) => {
        const notification = notifications[idx];
        const userIdStr = String(adminUser._id);

        io.to(userIdStr).emit("newNotification", {
          userId: userIdStr,
          notificationId: String(notification._id),
          message: notification.message,
          createdAt: notification.createdAt,
        });

        if (adminUser.fcmTokens?.length) {
          try {
            await admin.messaging().sendEachForMulticast({
              tokens: adminUser.fcmTokens.map((tokenObj) => tokenObj.token),
              notification: {
                title: "📢 New Notification",
                body: message,
              },
              data: {
                userId: userIdStr,
                notificationId: String(notification._id),
                link: notification.link || "",
              },
            });
          } catch (err) {
            console.error("FCM push failed for admin:", adminUser._id, err);
          }
        }
      })
    );

    res.status(201).json({
      success: true,
      message: "Donation created successfully",
      donation,
    });
  } catch (error) {
    console.error("Create Donation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

// Get Donation Image
const getDonationImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const stream = gfs.openDownloadStream(fileId);

    stream.on('error', () => res.status(404).send('File not found'));
    stream.pipe(res);
  } catch (err) {
    res.status(500).send('Error retrieving file');
  }
};

// Get Donations
const getDonations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    if (userRoles.includes('user')) {
      const donations = await Donation.find({ donor: userId })
        .populate('dealer', 'firstName lastName email phone profileImage')
        .sort({ createdAt: -1 });

      const donationCount = donations.length;

      res.status(200).json({
        success: true,
        message: 'User donations fetched successfully',
        count: donationCount,
        donations,
      });
      return;
    }

    if (userRoles.includes('volunteer')) {
      const donations = await Donation.find({ assignedVolunteer: userId }).sort({
        pickupDate: 1,
      });

      const today = new Date().toISOString().split('T')[0];

      const stats = {
        assigned: donations.length,
        upcoming: donations.filter((d) => new Date(d.pickupDate) > new Date()).length,
        completed: donations.filter((d) => d.status === 'donated').length,
        todayTasks: donations
          .filter((d) => d.pickupDate.toISOString().split('T')[0] === today)
          .map((d) => `${d.addressLine1} at ${d.pickupTime}`),
      };

      res.status(200).json({
        success: true,
        message: 'Volunteer donations fetched successfully',
        stats,
      });
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Access denied: Only users or volunteers can access this route',
    });
  } catch (err) {
    console.error('Get donations error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get donations',
      error: (err as Error).message,
    });
  }
};

// Get Donation by ID
const getDonationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!userRoles.includes('dealer')) {
      res.status(403).json({ message: 'Access denied: Dealers only' });
      return;
    }

    const donation = await Donation.findOne({ _id: id, dealer: userId })
      .populate('donor', 'firstName lastName email phone profileImage')
      .populate('dealer', 'firstName email profileImage');

    if (!donation) {
      res.status(404).json({
        success: false,
        message: 'Donation not found or not assigned to you',
      });
      return;
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (err) {
    console.error('Error fetching donation by ID:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Update Donation
const updateDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = req.user;
    if (!user || !user.roles.includes('user')) {
      res.status(403).json({
        message: 'Access denied. Only users can update donations.',
      });
      return;
    }

    const donation = await Donation.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!donation) {
      res.status(404).json({ error: 'Donation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      donation,
    });
  } catch (error) {
    console.error('Edit Donation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating donation',
      error: (error as Error).message,
    });
  }
};

// Get Donations Count
const getDonationsCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(400).json({ message: 'Missing userId' });
      return;
    }

    const count = await Donation.countDocuments({ donor: userId });
    res.status(200).json({
      success: true,
      message: 'Donation count fetched successfully',
      count,
    });
  } catch (err) {
    console.error('Error fetching donation count:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Donations Count by Status
const getDonationsCountByStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);

    const counts = await Donation.aggregate([
      {
        $match: { donor: userId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = counts.reduce((acc: Record<string, number>, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Donation counts fetched successfully',
      counts: result,
    });
  } catch (err) {
    console.error('Error fetching donation counts by status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

const getDonationByIdForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Only fetch donation where the current user is the donor
    const donation = await Donation.findOne({ _id: id, donor: userId })
      .populate('donor', 'firstName lastName email phone profileImage')
      .populate('dealer', 'firstName email profileImage');

    if (!donation) {
      res.status(404).json({
        success: false,
        message: 'Donation not found or not accessible to you',
      });
      return;
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (err) {
    console.error('Error fetching donation by ID:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Tasks
// Get Assigned Tasks
const getMyAssignedTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, roles } = req.user!;

    if (!Array.isArray(roles) || !roles.includes('volunteer')) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Volunteer role required.',
      });
      return;
    }

    const tasks = await VolunteerTask.find({ 'volunteers.user': userId })
      .populate('volunteers.user', 'firstName lastName email phone profileImage')
      .lean();

    if (!tasks || tasks.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No tasks assigned to you.',
      });
      return;
    }

    const tasksWithVolunteerStatus = tasks.map((task) => {
      const volunteer = task.volunteers.find((vol) => {
        return vol.user && vol.user._id && vol.user._id.toString() === userId;
      });
      return {
        ...task,
        myVolunteerStatus: volunteer ? volunteer.status : 'pending',
      };
    });


    res.status(200).json({
      success: true,
      message: 'Assigned tasks fetched successfully.',
      tasks: tasksWithVolunteerStatus,
    });
  } catch (err) {
    console.error('Error fetching assigned tasks:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks.',
      error: (err as Error).message,
    });
  }
};

// Get Task Count
const getTaskCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, roles } = req.user!;

    if (!Array.isArray(roles) || !roles.includes('volunteer')) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Volunteer role required.',
      });
      return;
    }

    const count = await VolunteerTask.countDocuments({
      'volunteers.user': userId,
    });

    res.status(200).json({
      success: true,
      message: 'Volunteer task count fetched successfully.',
      count,
    });
  } catch (err) {
    console.error('Error fetching volunteer task count:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task count.',
      error: (err as Error).message,
    });
  }
};

// Get Task Count by Status
const getTaskCountByStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, roles } = req.user!;

    if (!Array.isArray(roles) || !roles.includes('volunteer')) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Volunteer role required.',
      });
      return;
    }

    const counts = await VolunteerTask.aggregate([
      {
        $match: { 'volunteers.user': new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const allStatuses = ['pending', 'active', 'completed', 'cancelled'];
    const result = allStatuses.reduce((acc: Record<string, number>, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    counts.forEach((item) => {
      result[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      message: 'Volunteer task counts fetched successfully.',
      counts: result,
    });
  } catch (err) {
    console.error('Error fetching volunteer task counts by status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task counts.',
      error: (err as Error).message,
    });
  }
};

// Update Task Status
const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action } = req.body as UpdateTaskStatusBody;
  const userId = req.user?.userId;

  if (!['accept', 'reject'].includes(action)) {
    res.status(400).json({ success: false, message: 'Invalid action.' });
    return;
  }

  const statusMap: Record<string, string> = {
    accept: 'accepted',
    reject: 'rejected',
  };

  const statusToUpdate = statusMap[action] || 'pending';

  try {
    const updatedTask = await VolunteerTask.findOneAndUpdate(
      {
        _id: id,
        'volunteers.user': userId,
      },
      {
        $set: {
          'volunteers.$.status': statusToUpdate,
        },
      },
      { new: true }
    ).populate('volunteers.user', 'firstName lastName');

    if (!updatedTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you are not assigned as a volunteer.',
      });
      return;
    }

    const volunteer = updatedTask.volunteers.find(
      (v) => v.user && (v.user._id as Types.ObjectId).toString() === userId
    );

    function isPopulatedUser(user: Types.ObjectId | IUser): user is IUser {
      return typeof user !== 'undefined' && !(user instanceof Types.ObjectId);
    }

    const volunteerName =
      volunteer?.user && isPopulatedUser(volunteer.user)
        ? volunteer.user.firstName
        : 'A volunteer';

    const admins = await User.find({ roles: 'admin' });

    const notifications = admins.map((admin) => ({
      userId: admin._id,
      type: 'volunteer-task',
      title: `Task ${statusToUpdate}`,
      message: `${volunteerName} has ${statusToUpdate} a task.`,
    }));

    // Insert notifications and get the created docs with _id
    const createdNotifications = await Notification.insertMany(notifications);

    const io = getIO();

    for (let i = 0; i < admins.length; i++) {
      const adminUser = admins[i];
      const adminId = (adminUser._id as Types.ObjectId).toString();
      const notif = createdNotifications[i];

      // 🔹 Socket.io push with notificationId and userId
      io.to(adminId).emit("notification", {
        userId: adminId,
        notificationId: String(notif._id),
        title: notif.title,
        message: notif.message,
      });

      // 🔹 Firebase push
      if (adminUser.fcmTokens && adminUser.fcmTokens.length > 0) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: adminUser.fcmTokens.map(t => t.token),
            notification: {
              title: notif.title,
              body: notif.message,
            },
            data: {
              userId: adminId,
              notificationId: String(notif._id),
              taskStatus: statusToUpdate,
              volunteerName,
            },
          });
        } catch (err) {
          console.error(`FCM push failed for admin ${adminId}:`, err);
        }
      }
    }


    res.status(200).json({
      success: true,
      message: `Task ${action}ed successfully.`,
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error updating volunteer task status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// Delete Account
const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Get Donations by Dealer
const getDonationsByDealer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!userRoles.includes('dealer')) {
      res.status(403).json({ message: 'Access denied: Dealers only' });
      return;
    }

    const donations = await Donation.find({ dealer: userId })
      .populate('donor', 'firstName email profileImage')
      .populate('dealer', 'firstName email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Dealer donations fetched successfully',
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error('Error fetching dealer donations:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Pickup Donations
const getPickupDonations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: No user found' });
      return;
    }

    if (!userRoles.includes('dealer')) {
      res.status(403).json({ message: 'Access denied: Dealers only' });
      return;
    }

    const pickupStatuses = ['assigned', 'in-progress', 'picked-up'];

    const totalPickupCount = await Donation.countDocuments({
      status: { $in: pickupStatuses },
      dealer: userId,
    });

    const pickupDonations = await Donation.find({
      status: { $in: pickupStatuses },
      dealer: userId,
    }).populate('donor', 'firstName lastName email phone profileImage');

    res.status(200).json({
      success: true,
      message: 'Pickup donations fetched successfully',
      totalPickups: totalPickupCount,
      donations: pickupDonations,
    });
  } catch (error) {
    console.error('Error fetching pickup donations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Update Donation Status
const updateDonationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const user = req.user;
    if (!user || !user.roles.includes('dealer')) {
      res.status(403).json({ message: 'Access denied: Only dealers can update donations' });
      return;
    }

    // Ensure status is one of the allowed values
    if (!dealerUpdatableStatuses.includes(status)) {
      res.status(400).json({
        message: 'Invalid status. Dealers can only update to: in-progress, picked-up, or donated.',
      });
      return;
    }

    const safeStatus = status as DealerUpdatableStatus;

    const donation = await Donation.findById(id).populate('dealer');
    if (!donation) {
      res.status(404).json({ message: 'Donation not found' });
      return;
    }

    // Verify dealer ownership
    if ((donation.dealer as { _id: any })?._id.toString() !== user.userId.toString()) {
      res.status(403).json({ message: 'You are not authorized to update this donation' });
      return;
    }

    // Update status and activity log
    donation.status = safeStatus;
    donation.activityLog.push({
      action: safeStatus,
      by: new Types.ObjectId(user.userId),
      note: note || `Dealer updated status to ${safeStatus}`,
    });

    await donation.save();

    // --- Send socket + FCM notifications ---
    const io = getIO();
    const donorId = (donation.donor as IUser | Types.ObjectId)?._id?.toString();

    const isPopulatedUser = (user: Types.ObjectId | IUser): user is IUser =>
      typeof user !== "undefined" && !(user instanceof Types.ObjectId);

    const dealer = donation.dealer;
    const dealerName = dealer && isPopulatedUser(dealer) ? dealer.firstName : "Dealer";

    //  Notify Donor
    if (donorId) {
      const message = `Your donation has been marked as '${safeStatus}' by dealer ${dealerName}.`;

      const notification = await Notification.create({
        userId: donorId,
        message,
        type: "donation-status",
        link: "/donationdetails",
      });

      // 🔹 Socket.io push
      io.to(donorId.toString()).emit("newNotification", {
        userId: donorId.toString(),
        message: notification.message,
        notificationId: String(notification._id),
        link: notification.link,
      });

      // 🔹 Firebase push
      const donorUser = await User.findById(donorId, "fcmTokens");
      if (donorUser?.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: donorUser.fcmTokens.map(t => t.token),
            notification: {
              title: "Donation Status Updated",
              body: message,
            },
            data: {
              userId: donorId.toString(),
              notificationId: String(notification._id),
              type: "donation-status",
              donationId: String(donation._id),
              link: "/donationdetails",
            },
          });
        } catch (err) {
          console.error("FCM push to donor failed:", err);
        }
      }
    }

    //  Notify Admins
    const admins = await User.find({ roles: "admin" }, "_id fcmTokens");
    const adminMessage = `Dealer ${dealerName} updated donation status to '${safeStatus}'.`;

    for (const adminUser of admins) {
      const adminId = (adminUser._id as Types.ObjectId).toString();

      const notification = await Notification.create({
        userId: adminId,
        message: adminMessage,
        type: "dealer-update",
        link: `/pickups/${donation._id}`,
      });

      // 🔹 Socket.io push
      io.to(adminId).emit("newNotification", {
        userId: adminId,
        message: notification.message,
        notificationId: String(notification._id),
        link: notification.link,
      });

      // 🔹 Firebase push
      if (adminUser.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: adminUser.fcmTokens.map(tokenObj => tokenObj.token),
            notification: {
              title: "Dealer Update",
              body: adminMessage,
            },
            data: {
              userId: adminId,
              notificationId: String(notification._id),
              type: "dealer-update",
              donationId: String(donation._id),
              link: `/pickups/${donation._id}`,
            },
          });
        } catch (err) {
          console.error(`FCM push to admin ${adminId} failed:`, err);
        }
      }
    }


    res.status(200).json({
      success: true,
      message: 'Donation status updated by dealer',
      donation,
    });
  } catch (err) {
    console.error('Dealer status update error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Add Price and Weight
const addPriceandweight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { price, weight, notes } = req.body as AddPriceAndWeightBody;

    const userId = req.user?.userId;
    const roles = req.user?.roles || [];

    const isDealer = Array.isArray(roles) ? roles.includes('dealer') : roles === 'dealer';

    if (!isDealer) {
      res.status(403).json({
        message: 'Access denied: Only dealers can update donation price/weight',
      });
      return;
    }

    const donation = await Donation.findById(id).populate('dealer');
    if (!donation) {
      res.status(404).json({ message: 'Donation not found' });
      return;
    }

    if ((donation.dealer?._id as Types.ObjectId).toString() !== userId!.toString()) {
      res.status(403).json({
        message: 'You are not authorized to update this donation',
      });
      return;
    }

    if (price === undefined || weight === undefined) {
      res.status(400).json({ message: 'Price and weight are required' });
      return;
    }

    donation.price = price;
    donation.weight = weight;
    if (notes !== undefined) donation.notes = notes;

    await donation.save();

    const io = getIO();

    function isPopulatedUser(user: Types.ObjectId | IUser | undefined): user is IUser {
      return user !== undefined && !(user instanceof Types.ObjectId);
    }

    const dealerName = isPopulatedUser(donation.dealer)
      ? donation.dealer.firstName
      : "Dealer";

    //  Notify Donor
    const donorId = donation.donor?._id?.toString();
    if (donorId) {
      const message = `Dealer ${dealerName} updated your donation with price ₹${price} and weight ${weight}kg.`;

      const notification = await Notification.create({
        userId: donorId,
        message,
        type: "donation-update",
        link: "/donationdetails",
      });

      // 🔹 Socket.io
      io.to(donorId).emit("newNotification", {
        message: notification.message,
        userId: donorId,
        notificationId: String(notification._id),
        link: notification.link,
      });

      // 🔹 Firebase push
      const donorUser = await User.findById(donorId, "fcmTokens");
      if (donorUser?.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: donorUser.fcmTokens.map(tokenObj => tokenObj.token),
            notification: {
              title: "Donation Updated",
              body: message,
            },
            data: {
              type: "donation-update",
              donationId: String(donation._id),
              userId: donorId,
              notificationId: String(notification._id),
            },
          });
        } catch (err) {
          console.error(" FCM push to donor failed:", err);
        }
      }
    }

    const admins = await User.find({ roles: "admin" }, "_id fcmTokens");
    const adminMessage = `Dealer ${dealerName} updated price ₹${price} and weight ${weight}kg for a donation.`;

    for (const adminUser of admins) {   //  renamed
      const adminId = (adminUser._id as Types.ObjectId).toString();

      const notification = await Notification.create({
        userId: adminId,
        message: adminMessage,
        type: "dealer-update",
        link: `/pickups/${donation._id}`,
      });

      io.to(adminId).emit("newNotification", {
        message: notification.message,
        notificationId: String(notification._id),
        userId: adminId,
        link: notification.link,
      });

      if (adminUser.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: adminUser.fcmTokens.map(t => t.token),
            notification: {
              title: "Dealer Update",
              body: adminMessage,
            },
            data: {
              userId: adminId,
              notificationId: String(notification._id),
              type: "dealer-update",
              donationId: String(donation._id),
              link: `/pickups/${donation._id}`,
            },
          });
        } catch (err) {
          console.error(` FCM push to admin ${adminId} failed:`, err);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      donation,
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Get Donation History
const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: No user found' });
      return;
    }

    if (!userRoles.includes('dealer')) {
      res.status(403).json({ message: 'Access denied: Dealers only' });
      return;
    }

    const donatedStatus = ['donated', 'processed', 'recycled'];

    const totalDonatedCount = await Donation.countDocuments({
      status: { $in: donatedStatus },
      dealer: userId,
    });

    const donatedPickups = await Donation.find({
      status: { $in: donatedStatus },
      dealer: userId,
    })
      .populate('donor', 'firstName lastName email phone profileImage')
      .populate('recycler', 'firstName lastName email phone profileImage');
    res.status(200).json({
      success: true,
      message: 'Donated pickups fetched successfully',
      totalPickups: totalDonatedCount,
      donations: donatedPickups,
    });
  } catch (error) {
    console.error('Error fetching donated pickups:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Get Sliders
const getSliders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sliders = await Slider.find();
    res.status(200).json({
      success: true,
      message: 'Sliders fetched successfully',
      sliders,
    });
  } catch (error) {
    console.error('Error in getSliders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sliders',
      error: (error as Error).message,
    });
  }
};

// Get Logo
const logoGet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logo = await Logo.findOne();
    if (!logo) {
      res.status(404).json({ message: 'Logo not found' });
      return;
    }

    const file = await gfs.find({ filename: logo.filename }).toArray();
    if (!file || file.length === 0) {
      res.status(404).json({ message: 'File not found in GridFS' });
      return;
    }

    const fileId = file[0]._id;
    const readStream = gfs.openDownloadStream(fileId);
    res.set('Content-Type', file[0].contentType);
    readStream.pipe(res);
  } catch (err) {
    console.error('Error fetching logo:', err);
    res.status(500).json({
      message: 'Error fetching logo',
      error: (err as Error).message,
    });
  }
};

// Gaudaan Form
const gaudaanForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      address,
      pickupDate,
      pickupTime,
      governmentId,
      animalRegisteredId,
      animalType,
      animalCondition,
      animalDescription,
      consent,
    } = req.body as GaudaanFormBody;

    // ✅ Consent required
    if (consent !== true && consent !== "true") {
      res.status(400).json({ message: "Consent is required" });
      return;
    }

    // ✅ Required fields check
    const requiredFields: Record<string, string> = {
      name,
      email,
      phone,
      address,
      pickupDate,
      pickupTime,
      animalType,
    };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === "") {
        res.status(400).json({ message: `${key} is required` });
        return;
      }
    }

    // ✅ Validations
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      res.status(400).json({ message: "Phone must be 10 digits" });
      return;
    }
    if (animalRegisteredId && animalRegisteredId.trim() === "") {
      res
        .status(400)
        .json({ message: "Animal Registered ID cannot be empty if provided" });
      return;
    }

    // ✅ File uploads
    const images: { url: string }[] = [];
    const files = req.files as Express.Multer.File[] | undefined;

    if (files) {
      for (const file of files) {
        const stream = Readable.from(file.buffer);
        const filename = `${Date.now()}-${file.originalname}`;

        const uploadStream = gfs.openUploadStream(filename, {
          contentType: file.mimetype,
        });

        await new Promise((resolve, reject) => {
          stream
            .pipe(uploadStream)
            .on("finish", () => {
              images.push({ url: `/file/${uploadStream.id}` });
              resolve(null);
            })
            .on("error", reject);
        });
      }
    }

    // ✅ Save record
    const gaudaan = new Gaudaan({
      donor: req.user?.userId,
      name,
      email,
      phone,
      address,
      pickupDate,
      pickupTime,
      images,
      governmentId: governmentId || "",
      animalRegisteredId: animalRegisteredId || "",
      animalType,
      animalCondition: animalCondition || "healthy",
      animalDescription: animalDescription || "",
      consent: consent === "true",
      statusHistory: [
        {
          status: "unassigned",
          timestamp: new Date(),
        },
      ],
    });


    await gaudaan.save();

    // ✅ Find admins
    const admins = await User.find({
      roles: "admin",
      notificationsEnabled: true,
    });

    // ✅ Create DB notifications
    const notifications = await Promise.all(
      admins.map(adminUser =>
        Notification.create({
          userId: adminUser._id,
          message: `🪔 New Gaudaan submitted by ${gaudaan.name}`,
          link: `/gaudaan/${gaudaan._id}`,
        })
      )
    );

    const gaudaanId = String(gaudaan._id);
    const msg = `🪔 New Gaudaan submitted by ${gaudaan.name}`;

    for (let i = 0; i < admins.length; i++) {
      const adminUser = admins[i];
      const notification = notifications[i];

      // Socket notification
      if (req.io) {
        req.io
          .to((adminUser._id as Types.ObjectId).toString())
          .emit("newNotification", {
            userId: String(adminUser._id),
            message: msg,
            notificationId: String(notification._id),
            link: notification.link,
          });
      }

      // FCM push notification
      if (adminUser.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: adminUser.fcmTokens.map(t => t.token),
            notification: {
              title: "New Gaudaan Submission",
              body: msg,
            },
            data: {
              userId: String(adminUser._id),
              gaudaanId,
              type: "gaudaan",
              notificationId: String(notification._id),
              link: `/gaudaan/${gaudaanId}`,
            },
          });
        } catch (err) {
          console.error(`FCM push failed for admin ${adminUser._id}:`, err);
        }
      }
    }


    res.status(201).json({
      message: "Gaudaan record created successfully",
      data: gaudaan,
    });
  } catch (error) {
    console.error("Error creating Gaudaan:", error);
    res.status(400).json({
      message: "Error creating record",
      error: (error as Error).message,
    });
  }
};

// Get Gaudaan by User ID
const getGaudaanByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const roles = req.user?.roles || [];

    if (!roles.includes('user')) {
      res.status(403).json({ message: 'Access denied: Only users allowed' });
      return;
    }

    const records = await Gaudaan.find({ donor: userId })
      .populate('assignedVolunteer', 'firstName lastName phone profileImage')
      .populate('shelterId', 'name address phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Gaudaan records fetched successfully',
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching Gaudaan by user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

const getGaudaanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await Gaudaan.findById(id)
      .populate("assignedVolunteer", "firstName lastName phone profileImage fcmTokens")
      .populate("shelterId", "name address phone");

    if (!record) {
      res.status(404).json({ message: "Gaudaan record not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Gaudaan record fetched successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error fetching Gaudaan by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

// Get Assigned Gaudaan
const getAssignedGaudaan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const volunteerId = req.user?.userId;

    if (!volunteerId) {
      res.status(400).json({ message: 'Volunteer ID is required' });
      return;
    }

    const user = req.user;
    if (!user || !user.roles.includes('volunteer')) {
      res.status(403).json({
        message: 'Access denied: Only volunteers can access this route',
      });
      return;
    }

    const assignedGaudaan = await Gaudaan.find({
      assignedVolunteer: volunteerId,
    })
      .populate('assignedVolunteer', 'firstName lastName email phone profileImage')
      .populate('donor', 'firstName lastName phone profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Assigned Gaudaan fetched successfully',
      assignedGaudaan,
    });
  } catch (error) {
    console.error('Error fetching assigned Gaudaan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message,
    });
  }
};

// Get All Shelters
const getAllShelters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Shelters fetched successfully',
      count: shelters.length,
      shelters,
    });
  } catch (err) {
    console.error('Error fetching shelters:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching shelters',
      error: (err as Error).message,
    });
  }
};

// Update Gaudaan Status 
const updategaudaanStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, shelterId } = req.body as UpdateGaudaanStatusBody;
    const userId = req.user?.userId;

    const roles = req.user?.roles || [];
    if (!roles.includes('volunteer')) {
      res.status(403).json({
        message: 'Access denied: Only volunteers allowed',
      });
      return;
    }

    // Define allowed statuses explicitly
    const allowedStatuses = ['unassigned', 'assigned', 'picked_up', 'shelter', 'dropped', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    // Fetch the donation by ID
    const donation = await Gaudaan.findById(id);
    if (!donation) {
      res.status(404).json({ message: 'Donation not found' });
      return;
    }

    // Handle specific statuses that require a shelterId
    if (['shelter', 'dropped'].includes(status)) {
      if (!shelterId) {
        res.status(400).json({ message: 'shelterId is required for this status' });
        return;
      }

      const shelterExists = await Shelter.findById(shelterId);
      if (!shelterExists) {
        res.status(404).json({ message: 'Shelter not found' });
        return;
      }
      donation.shelterId = new mongoose.Types.ObjectId(shelterId);
    }

    // Update donation status
    donation.status = status as IGaudaan['status']; // Ensure the status is valid
    donation.lastModifiedBy = new mongoose.Types.ObjectId(userId);
    donation.statusHistory.push({
      status: status as "unassigned" | "assigned" | "picked_up" | "shelter" | "dropped" | "rejected",
      changedBy: new mongoose.Types.ObjectId(userId),
    });

    // Save donation and notify users
    await donation.save();

    const io = getIO();
    const donorId = donation.donor.toString();

    // ---------------- Donor Notification ----------------
    const message = `Your Gaudaan donation status has been updated to '${status}'.`;

    // Save in DB
    const notification = await Notification.create({
      userId: donorId,
      message,
      type: "gaudaan-status",
      link: `/gaudaan/${donation._id}`,
    });

    // Send via socket.io
    io.to(donorId).emit("newNotification", {
      userId: donorId,
      message: notification.message,
      notificationId: String(notification._id),
      link: notification.link,
    });

    // Send Firebase push to donor
    const donor = await User.findById(donorId, "fcmTokens");
    if (donor?.fcmTokens?.length) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: donor.fcmTokens.map(t => t.token),
          notification: {
            title: "Gaudaan Update",
            body: message,
          },
          data: {
            userId: donorId,
            type: "gaudaan-status",
            donationId: String(donation._id),
            notificationId: String(notification._id),
            link: notification.link!,
          },
        });
      } catch (err) {
        console.error(` Failed to push to donor ${donorId}`, err);
      }
    }

    // ---------------- Admin Notifications ----------------
    const admins = await User.find({ roles: "admin" }, "_id fcmTokens");
    const adminMessage = `Volunteer updated Gaudaan status to '${status}'.`;

    // Create DB notifications for admins
    const adminNotifications = await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          message: adminMessage,
          type: "gaudaan-update",
          link: `/gaudaan/${donation._id}`,
        })
      )
    );

    // Emit socket + send Firebase push
    for (let i = 0; i < admins.length; i++) {
      const adminUser = admins[i];
      const adminId = (adminUser._id as Types.ObjectId).toString();
      const adminNotification = adminNotifications[i];

      io.to(adminId).emit("newNotification", {
        userId: adminId,
        message: adminNotification.message,
        notificationId: String(adminNotification._id),
        link: adminNotification.link,
      });

      if (adminUser.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: adminUser.fcmTokens.map(t => t.token),
            notification: {
              title: "Gaudaan Update",
              body: adminMessage,
            },
            data: {
              userId: adminId,
              type: "gaudaan-update",
              donationId: String(donation._id),
              notificationId: String(adminNotification._id),
              link: adminNotification.link!,
            },
          });
        } catch (err) {
          console.error(` Failed to push to admin ${adminId}`, err);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Gaudaan status updated successfully',
      donation,
    });
  } catch (err) {
    console.error('Update Gaudaan status error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Assign Recycler
const getRecyclers = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Assuming req.user has been populated by middleware
    const user = req.user as IUser; // Type assertion to ensure req.user is IUser
    const roles = user.roles;

    // Fetch recyclers with the "recycler" role
    const recyclers = await User.find({ roles: "recycler" });

    // Check if the current user has the "dealer" role
    if (!user || !roles.some((role) => roles.includes("dealer"))) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role(s): ${user.roles.join(", ")}`,
      });
    }

    return res.status(200).json({ success: true, recyclers });
  } catch (error) {
    console.error("Error fetching recyclers:", error);
    return res.status(500).json({ success: false, message: "Server error", error: "Unknown error" });
  }
};

const assignRecycler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { recyclerId } = req.body as AssignRecyclerBody;
    const userId = req.user?.userId;
    const roles = req.user?.roles || [];

    if (!roles.includes('dealer')) {
      res.status(403).json({
        message: 'Access denied: Only dealers can assign recyclers',
      });
      return;
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      res.status(404).json({ message: 'Donation not found' });
      return;
    }

    const recycler = await User.findById(recyclerId);
    if (!recycler || !recycler.roles.includes('recycler')) {
      res.status(404).json({ message: 'Recycler not found or invalid role' });
      return;
    }

    donation.recycler = new mongoose.Types.ObjectId(recyclerId);
    donation.activityLog.push({
      action: 'assigned',
      by: new mongoose.Types.ObjectId(userId),
      note: `Recycler ${recycler.firstName} assigned`,
    });

    await donation.save();

    const io = getIO();
    const message = `You have been assigned as the recycler for a donation.`;

    // Save in DB
    const notification = await Notification.create({
      userId: recyclerId,
      message,
      type: "recycler-assignment",
      link: `/processedData`,
    });

    // Send via socket.io
    io.to(recyclerId).emit("newNotification", {
      userId: recyclerId,                   // added userId
      notificationId: notification._id,    // added notificationId
      message: notification.message,
      link: notification.link,
    });

    // Send Firebase push
    const recyclerUser = await User.findById(recyclerId, "fcmTokens");
    if (recyclerUser?.fcmTokens?.length) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: recyclerUser.fcmTokens.map(t => t.token),
          notification: {
            title: "New Assignment",
            body: message,
          },
          data: {
            type: "recycler-assignment",
            donationId: String(donation._id),
            userId: String(recyclerId),
            notificationId: String(notification._id),
          },
        });
      } catch (err) {
        console.error(" Firebase push failed for recycler:", recyclerId, err);
      }
    }


    res.status(200).json({
      success: true,
      message: 'Recycler assigned successfully',
      donation,
    });
  } catch (err) {
    console.error('Assign recycler error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

const getRecyclerDonations = async (req: Request, res: Response): Promise<Response> => {
  const user = req.user as IUser; // Type assertion to specify req.user as IUser
  const userId = user.userId;
  const roles = user.roles;

  // Check if user has the 'recycler' role
  if (!roles.includes("recycler")) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    // Fetch donations assigned to the recycler with the 'processed' or 'donated' status
    const donations = await Donation.find({
      recycler: userId,
      status: { $in: ["processed", "donated"] },
    })
      .populate("donor", "firstName lastName email phone profileImage")
      .populate("dealer", "firstName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Recycler fetch error:", err);
    return res.status(500).json({ message: "Server error", error: onmessage });
  }
};

const getRecycleDonations = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Type assertion to specify req.user as IUser
    const user = req.user as IUser;
    const userId = user.userId;
    const roles = user.roles || [];

    // Check if the user has the 'recycler' role
    if (!userId || !roles.includes("recycler")) {
      return res.status(403).json({ message: "Access denied: Recycler only" });
    }

    // Fetch donations that are 'recycled' for the given recycler
    const donations = await Donation.find({
      recycler: userId,
      status: "recycled",
    })
      .populate("donor", "firstName lastName email phone profileImage") // Populate donor fields
      .populate("dealer", "firstName lastName email phone profileImage") // Populate dealer fields
      .sort({ updatedAt: -1 });

    // Return the donations
    return res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching recycler donations:", err);
    return res.status(500).json({ message: "Server error", error: onmessage });
  }
};

const recyclerUpdateStatus = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { status, note } = req.body;
  const recyclerId = (req as AuthRequest).user?.userId;

  try {
    // Find the donation by ID
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Check if the logged-in user is authorized to update the donation
    if (String(donation.recycler) !== recyclerId) {
      return res.status(403).json({ message: "You are not authorized to update this donation" });
    }

    // Check if the provided status is valid
    if (!["recycled", "processed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    // Update the donation status and activity log
    donation.status = status;
    donation.activityLog.push({
      action: status,
      by: new Types.ObjectId(recyclerId),
      note,
    });

    // Save the updated donation
    await donation.save();

    const io = getIO();

    if (donation.dealer && donation.dealer._id) {
      const dealerId = donation.dealer._id.toString();
      const msg = `Recycler updated donation status to '${status}'.`;

      // Save notification in DB
      const notification = await Notification.create({
        userId: dealerId,
        message: msg,
        type: "donation-update",
        link: `/donation/${donation._id}`,
      });

      // Socket.io push
      io.to(dealerId).emit("notification", {
        userId: dealerId,
        notificationId: notification._id,
        title: "Donation Updated",
        message: msg,
        donationId: donation._id,
        type: "donation-update",
        timestamp: new Date(),
        link: notification.link,
      });

      // Firebase push
      const dealerUser = await User.findById(dealerId, "fcmTokens");
      if (dealerUser?.fcmTokens?.length) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: dealerUser.fcmTokens.map(t => t.token),
            notification: {
              title: "Donation Updated",
              body: msg,
            },
            data: {
              type: "donation-update",
              donationId: String(donation._id),
              status,
              userId: dealerId,
              notificationId: String(notification._id),
              link: notification.link!,
            },
          });
        } catch (err) {
          console.error(" Firebase push failed for dealer:", dealerId, err);
        }
      }
    } else {
      console.error("Dealer is not defined for this donation");
    }

    // Return a success response
    return res.status(200).json({ success: true, message: "Donation updated", donation });
  } catch (err) {
    console.error("Update recycler status error:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// Get Notifications
const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      notifications,
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message,
    });
  }
};

// Google Login
const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token, phone } = req.body;
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Verify Firebase ID Token
    const decoded = await admin.auth().verifyIdToken(token);
    const { email, name, picture, uid, phone_number } = decoded;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create minimal user
      user = new User({
        email: normalizedEmail,
        profileImage: picture,
        providerId: uid,
        roles: ["user"],
        isProfileComplete: false,
      });
      await user.save();

      return res.status(200).json({
        redirect: true,
        userId: String(user._id),
      });
    }

    // If phone missing, update
    if (!user.phone && (phone || phone_number)) {
      user.phone = phone || phone_number;
      await user.save();
    }

    if (!user.isProfileComplete) {
      return res.status(200).json({
        redirect: true,
        userId: String(user._id),
      });
    }

    // Generate app JWT
    const appToken = user.generateToken();

    res.json({
      success: true,
      token: appToken,
      user,
      userId: String(user._id),
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Google login failed" });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Complete Profile for GSignup
const completeProfile = async (req: Request, res: Response) => {
  try {
    const { userId, firstName, lastName, email, phone, roles } = req.body;

    const existingUser = await User.findOne({
      phone,
      _id: { $ne: userId }, // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }

    //  update instead of creating new
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, phone, roles, isProfileComplete: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔑 issue JWT token
    const token = user.generateToken();

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ message: "Profile completion failed" });
  }
};




// Export all controller functions
export default {
  volunteerSignup,
  signUpAuth,
  signInAuth,
  logoutAuth,
  forgotPassword,
  resetPassword,
  sendOTPapp,
  otpVerify,
  resetPasswordApp,
  fetchUsers,
  getUserProfile,
  updateUserProfile,
  getProfileImage,
  changePassword,
  assignVolunteerRole,
  getTotalVolunteers,
  getTotalCities,
  getTotalScrapedWeight,
  getImpacts,
  createDonation,
  getDonationImage,
  getDonations,
  getDonationById,
  updateDonation,
  getDonationsCount,
  getDonationsCountByStatus,
  getDonationByIdForUser,
  getMyAssignedTasks,
  getTaskCount,
  getTaskCountByStatus,
  updateTaskStatus,
  deleteAccount,
  getDonationsByDealer,
  getPickupDonations,
  updateDonationStatus,
  addPriceandweight,
  getHistory,
  getSliders,
  logoGet,
  gaudaanForm,
  getGaudaanByUserId,
  getGaudaanById,
  getAssignedGaudaan,
  getAllShelters,
  updategaudaanStatus,
  assignRecycler,
  getRecyclers,
  getRecyclerDonations,
  getRecycleDonations,
  recyclerUpdateStatus,
  getNotifications,
  googleLogin,
  getUserById,
  completeProfile,
  // Msg91
  sendOtp,
  verifyOtp,
  retryOtp
};