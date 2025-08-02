const mongoose = require("mongoose");
const User = require("../Model/AuthModel");
const Donation = require("../Model/DonationModel");
const VolunteerTask = require("../Model/TaskModel");
const Slider = require("../Model/SliderModel");
const Logo = require("../Model/Logo");
const Gaudaan = require("../Model/GaudaanModel");
const Shelter = require("../Model/ShelterModel");
const Impact = require("../Model/Impact");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { log } = require("console");
const { Readable } = require("stream");
const { getIO } = require("../config/socket");
const Notification = require("../Model/NotificationsModel");

let gfs;
const conn = mongoose.connection;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
});

// Volunteer data
const volunteerSignup = async (req, res) => {
  let { firstName, lastName, phone, email, password, otp, method } = req.body;

  // Input validation
  if (!firstName) {
    console.log("Validation Error: Missing First Name");
    return res.status(400).json({ message: "Missing First Name" });
  }
  if (!lastName) {
    console.log("Validation Error: Missing Last Name");
    return res.status(400).json({ message: "Missing Last Name" });
  }
  if (!email) {
    console.log("Validation Error: Missing Email");
    return res.status(400).json({ message: "Missing Email" });
  }
  if (!phone) {
    console.log("Validation Error: Missing Phone Number");
    return res.status(400).json({ message: "Missing Phone Number" });
  }
  if (!password) {
    console.log("Validation Error: Missing Password");
    return res.status(400).json({ message: "Missing Password" });
  }
  if (!otp || !method) {
    console.log("Validation Error: Missing OTP or method");
    return res.status(400).json({ message: "OTP and method required" });
  }

  try {
    email = email.toLowerCase();

    // ❌ OTP validation skipped for now (commented out)
    // 🧠 OTP Validation
    // const key = `${email}-${phone}`;
    // const storedOTP = otpStore.get(key);

    // if (!storedOTP) {
    //   return res.status(400).json({ message: "OTP not found or expired" });
    // }

    // if (Date.now() > storedOTP.expiresAt) {
    //   otpStore.delete(key);
    //   return res.status(400).json({ message: "OTP expired" });
    // }

    // if (storedOTP.otp !== otp) {
    //   return res.status(400).json({ message: "Invalid OTP" });
    // }

    // otpStore.delete(key); // ✅ Clear OTP after verification

    // ❌ Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    // ✅ Enforce only 'volunteer' role
    const validRoles = ["volunteer"];

    // ✅ Create the user
    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password, // Ensure password hashing is handled in your schema
      roles: validRoles,
    });

    // 🔐 Generate JWT
    const payload = {
      userId: newUser._id,
      email: newUser.email,
      roles: newUser.roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Success response
    res.status(200).json({
      success: true,
      message: "Volunteer registered successfully",
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        email: newUser.email,
        roles: newUser.roles,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during signup",
      error: err.message,
    });
  }
};

// User Data
const signUpAuth = async (req, res) => {
  let { firstName, lastName, phone, email, password, otp, method, roles } =
    req.body;

  // Input validation
  if (!firstName)
    return res.status(400).json({ message: "Missing First Name" });
  if (!lastName) return res.status(400).json({ message: "Missing Last Name" });
  if (!email) return res.status(400).json({ message: "Missing Email" });
  if (!phone) return res.status(400).json({ message: "Missing Phone Number" });
  if (!password) return res.status(400).json({ message: "Missing Password" });
  if (!otp || !method)
    return res.status(400).json({ message: "OTP and method required" });

  try {
    email = email.toLowerCase(); // ✅ Safe lowercase

    // 🧠 OTP Validation
    // const key = `${email}-${phone}`;
    // const storedOTP = otpStore.get(key);

    // if (!storedOTP) {
    //   return res.status(400).json({ message: "OTP not found or expired" });
    // }

    // if (Date.now() > storedOTP.expiresAt) {
    //   otpStore.delete(key);
    //   return res.status(400).json({ message: "OTP expired" });
    // }

    // if (storedOTP.otp !== otp) {
    //   return res.status(400).json({ message: "Invalid OTP" });
    // }

    // otpStore.delete(key); // ✅ Clear OTP after verification

    // ❌ Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    // ✅ Handle roles (with whitelist)
    if (typeof roles === "string") {
      roles = [roles];
    }

    const allowedRoles = ["user", "admin", "dealer", "recycler"];
    const validRoles = Array.isArray(roles)
      ? roles.filter((role) => allowedRoles.includes(role))
      : ["user"];

    if (validRoles.includes("admin")) {
      return res
        .status(400)
        .json({ message: "Cannot assign admin role directly" });
    }

    // ✅ Create the user
    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password, // Assuming you're hashing password via Mongoose pre-save hook
      roles: validRoles,
    });

    // 🔐 Generate JWT
    const payload = {
      userId: newUser._id,
      email: newUser.email,
      roles: newUser.roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Success response
    res.status(200).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        email: newUser.email,
        roles: newUser.roles,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Signup Error Stack:", err); // shows full trace
    res.status(500).json({
      success: false,
      message: "Server error during signup",
      error: err.message,
    });
  }
};

const otpStore = new Map();

const sendSMSOTP = async (phone, otp) => {
  const msg = `Your Gauabhayaranya OTP is: ${otp}. It expires in 5 minutes.`;

  const response = await axios.post(
    "https://control.msg91.com/api/v5/flow/",
    {
      flow_id: process.env.MSG91_FLOW_ID, // Template ID from MSG91
      sender: process.env.MSG91_SENDER_ID,
      mobiles: `91${phone}`, // Assuming Indian numbers
      VAR1: otp, // Replace with template variables (e.g., {{VAR1}})
    },
    {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const sendOTPAuth = async (req, res) => {
  const { phone, method } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number required" });
  }

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone already in use" });
    }

    const otp = 1234; // 🔐 Static OTP for testing
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const key = `${phone}`;
    otpStore.set(key, { otp, expiresAt });

    if (method === "phone") {
      console.log(`Sending OTP to ${phone}: ${otp}`); // 👀 For dev only
      await sendSMSOTP(phone, otp);
    } else {
      return res.status(400).json({ message: "Invalid OTP method" });
    }

    return res
      .status(200)
      .json({ success: true, message: `OTP sent via ${method}` });
  } catch (err) {
    console.error("Send OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while sending OTP",
      error: err.message,
    });
  }
};

const signInAuth = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET || "your_jwt_secret", // Use environment variable for secret
      { expiresIn: "1d" } // Token expires in 1 Day
    );

    // Return response with token, user, and role
    res.status(200).json({
      success: true,
      message: "Sign-in successful",
      token,
      user: {
        id: user._id, // Or `_id: user._id` to match frontend
        roles: user.roles || "user", // Ensure role is included
        roles: user.roles || [user.roles || "user"], // Include roles array for frontend
      },
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//Forgot & Reset Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Set token & expiry (1 hour)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetURL = `${process.env.REACT_APP_URL}/reset-password/${token}`;

  res.status(200).json({
    success: true,
    message: "Password reset link sent",
    resetURL, // remove this in production and just email it
  });
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(404).json({ message: "Token is invalid or expired" });
  }

  user.password = await newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
};

// Fetch Users
const fetchUsers = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Proceed to return user data (or list of users, depending on your intent)
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, email } = req.body;

    const user = await User.findById(userId).select("-password -roles");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];

      // Delete previous profile image from GridFS if it exists
      if (user.profileImage) {
        const oldImage = await conn.db.collection("uploads.files").findOne({
          filename: user.profileImage,
        });
        if (oldImage) {
          await gfs.delete(new mongoose.Types.ObjectId(oldImage._id));
        }
      }

      // Upload new image to GridFS
      const filename = `${Date.now()}-${file.originalname}`;
      const uploadStream = gfs.openUploadStream(filename, {
        contentType: file.mimetype,
      });

      // Write file buffer to GridFS
      uploadStream.write(file.buffer);
      uploadStream.end();

      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      // Store the filename in the user document
      user.profileImage = filename;
    } else if (req.body.profileImage) {
      user.profileImage = req.body.profileImage; // Handle case where no new file is uploaded
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getProfileImage = async (req, res) => {
  try {
    const filename = req.params.filename;
    const file = await conn.db
      .collection("uploads.files")
      .findOne({ filename });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const downloadStream = gfs.openDownloadStreamByName(filename);
    res.set("Content-Type", file.contentType);
    downloadStream.pipe(res);

    downloadStream.on("error", () => {
      res.status(404).json({ message: "Error retrieving file" });
    });
  } catch (err) {
    console.error("Error retrieving file:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both currentPassword and newPassword are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const assignVolunteerRole = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //Not combine
    if (user.roles.includes("dealer") || user.roles.includes("admin")) {
      return res.status(400).json({
        message:
          "Cannot combine 'volunteer' role to dealer or admin users only user",
      });
    }

    // Add "volunteer" to roles if not present
    if (!user.roles.includes("volunteer")) {
      user.roles.push("volunteer");
      await user.save();
    }

     // 🔔 Notify all admins
      const admins = await User.find({ roles: "admin" });
      const notifications = admins.map((admin) => ({
        user: admin._id,
        type: "volunteer",
        title: "New Volunteer Assigned",
        message: `${user.firstName || "A user"} is now a volunteer.`,
      }));
      await Notification.insertMany(notifications);

      // Optional: Emit socket.io event
      io.to(admin._id.toString()).emit("notification", {
        title: "New Volunteer Assigned",
        message: `${user.firstName} is now a volunteer.`,
      });
    

    res
      .status(200)
      .json({ success: true, message: "Volunteer role assigned", user });
  } catch (err) {
    console.error("Assign role error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getTotalVolunteers = async (req, res) => {
  try {
    // Count all users/volunteers who have the role 'volunteer'
    const total = await User.countDocuments({ roles: "volunteer" });

    res.status(200).json({
      success: true,
      message: "Total volunteers fetched successfully",
      totalVolunteers: total,
    });
  } catch (err) {
    console.error("Error fetching total volunteers:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getTotalCities = async (req, res) => {
  try {
    const counts = await Donation.aggregate([
      {
        $group: {
          _id: "$address.location", // or "$city" or whatever your donation location field is
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Format as { cityName: count, ... }
    const result = counts.reduce((acc, cur) => {
      acc[cur._id || "Unknown"] = cur.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Donation counts fetched successfully",
      counts: result,
    });
  } catch (err) {
    console.error("Error fetching donation counts by location:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getTotalScrapedWeight = async (req, res) => {
  try {
    const result = await Donation.aggregate([
      {
        $match: {
          status: { $in: ["picked-up", "donated"] },
          weight: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          weightDouble: { $toDouble: "$weight" },
        },
      },
      {
        $group: {
          _id: null,
          totalWeight: { $sum: "$weightDouble" },
        },
      },
    ]);

    const totalWeight = result[0]?.totalWeight || 0;

    return res.status(200).json({
      success: true,
      message: "Total collected donation weight calculated successfully",
      totalWeight,
    });
  } catch (err) {
    console.error("Error calculating total collected donation weight:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while calculating total weight",
      error: err.message,
    });
  }
};

const getImpacts = async (req, res) => {
  try {
    const impacts = await Impact.find();
    res.status(200).json({
      success: true,
      message: "Impacts fetched successfully",
      impacts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch impacts",
      error: err.message,
    });
  }
};

//Donation
const createDonation = async (req, res) => {
  try {
    const {
      scrapType,
      phone,
      description,
      addressLine1,
      addressLine2,
      pincode,
      city,
      country,
      pickupDate,
      pickupTime,
      images: bodyImages, // JSON string or array
    } = req.body;

    const donor = req.user?.userId;
    if (!donor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🟢 Validate required fields early
    const requiredFields = [
      scrapType,
      phone,
      description,
      pickupDate,
      pickupTime,
    ];
    if (requiredFields.some((field) => !field)) {
      return res
        .status(400)
        .json({ message: "Missing required donation fields" });
    }

    // 🟡 Convert pincode to number safely
    const pin = Number(pincode);
    if (isNaN(pin)) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    // 📤 Handle uploaded image files (from memoryStorage + GridFS)
    let uploadedImages = [];
    if (req.files?.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

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
              uploadedImages.push({ url: `/file/${uploadStream.id}` });
              resolve();
            })
            .on("error", (err) => {
              console.error("GridFS upload error:", err);
              reject(err);
            });
        });
      }
    }

    // 🌐 Handle image URLs from body
    let urlImages = [];
    if (req.body.images) {
      try {
        const parsed =
          typeof req.body.images === "string"
            ? JSON.parse(req.body.images)
            : req.body.images;

        if (Array.isArray(parsed)) {
          urlImages = parsed.filter((img) => img?.url);
        }
      } catch (err) {
        return res
          .status(400)
          .json({ message: "Invalid images format in body" });
      }
    }

    // 🧩 Combine both image sources
    const images = [...uploadedImages, ...urlImages];
    if (images.length === 0) {
      return res.status(400).json({ message: "No valid images provided." });
    }

    // 📝 Create donation
    const donation = await Donation.create({
      donor,
      scrapType,
      phone,
      description,
      addressLine1,
      addressLine2,
      pincode: pin,
      city,
      country,
      pickupDate,
      pickupTime,
      images,
      activityLog: [
        {
          action: "created",
          by: donor,
          note: "Donation created by donor.",
        },
      ],
    });

    // ✅ Notify all admins
    const admins = await User.find({ roles: "admin" }, "_id");
    const adminIds = admins.map((a) => a._id.toString());
    const message = `New donation created: ${scrapType}`;

    const notificationPromises = adminIds.map((adminId) =>
      Notification.create({ userId: adminId, message })
    );
    const createdNotifications = await Promise.all(notificationPromises);

    // ✅ Emit via Socket.IO to all admins
    const io = getIO();
    adminIds.forEach((adminId, index) => {
      io.to(adminId).emit("newNotification", {
        message,
        notificationId: createdNotifications[index]._id,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Donation created successfully",
      donation,
    });
  } catch (error) {
    console.error("❌ Create Donation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getDonationImage = async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const stream = gfs.openDownloadStream(fileId);

    stream.on("error", () => res.status(404).send("File not found"));
    stream.pipe(res);
  } catch (err) {
    res.status(500).send("Error retrieving file");
  }
};

const getDonations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRoles = req.user.roles;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
    }

    // 🔄 Route for 'user' to fetch their own donations
    if (userRoles.includes("user")) {
      const donations = await Donation.find({ donor: userId })
        .populate("dealer", "firstName lastName email phone profileImage")
        .sort({
          createdAt: -1,
        });

      const donationCount = donations.length;

      return res.status(200).json({
        success: true,
        message: "User donations fetched successfully",
        count: donationCount,
        donations,
      });
    }

    // ✅ Route for 'volunteer' to fetch assigned donations
    if (userRoles.includes("volunteer")) {
      const donations = await Donation.find({ assignedVolunteer: userId }).sort(
        {
          pickupDate: 1,
        }
      );

      const today = new Date().toISOString().split("T")[0];

      const stats = {
        assigned: donations.length,
        upcoming: donations.filter((d) => new Date(d.pickupDate) > new Date())
          .length,
        completed: donations.filter((d) => d.status === "completed").length,
        todayTasks: donations
          .filter((d) => d.pickupDate.split("T")[0] === today)
          .map((d) => `${d.address} at ${d.pickupTime}`),
      };

      return res.status(200).json({
        success: true,
        message: "Volunteer donations fetched successfully",
        stats,
      });
    }

    // ❌ Deny all others
    return res.status(403).json({
      success: false,
      message: "Access denied: Only users or volunteers can access this route",
    });
  } catch (err) {
    console.error("Get donations error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get donations",
      error: err.message,
    });
  }
};

const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = req.user;
    // Ensure only users can update donations
    if (!user || !user.roles.includes("user")) {
      return res.status(403).json({
        message: "Access denied. Only users can update donations.",
      });
    }
    const donation = await Donation.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Donation updated successfully",
      donation,
    });
  } catch (error) {
    console.error("Edit Donation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating donation",
      error: error.message,
    });
  }
};

const getDonationsCount = async (req, res) => {
  try {
    const userId = req.user.userId; // or req.query.userId if coming from query string

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const count = await Donation.countDocuments({ donor: userId });
    res.status(200).json({
      success: true,
      message: "Donation count fetched successfully",
      count,
    });
  } catch (err) {
    console.error("Error fetching donation count:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getDonationsCountByStatus = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const counts = await Donation.aggregate([
      {
        $match: {
          donor: userId, // adjust field name as per your model
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = counts.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Donation counts fetched successfully",
      counts: result,
    });
  } catch (err) {
    console.error("Error fetching donation counts by status:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//Task Data
const getMyAssignedTasks = async (req, res) => {
  try {
    const { userId, roles } = req.user;

    // Validate roles
    if (!Array.isArray(roles) || !roles.includes("volunteer")) {
      return res.status(403).json({ success: false, message: "Access denied: Volunteer role required." });
    }

    // Find tasks where user is in volunteers array
    const tasks = await VolunteerTask.find({ "volunteers.user": userId })
      .populate("volunteers.user", "firstName lastName email")
      .lean();

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tasks assigned to you.",
      });
    }

    // Add user's volunteer status to each task
    const tasksWithVolunteerStatus = tasks.map((task) => {
      const volunteer = task.volunteers.find((vol) => vol.user._id.toString() === userId);
      return {
        ...task,
        myVolunteerStatus: volunteer ? volunteer.status : "pending",
      };
    });

    res.status(200).json({
      success: true,
      message: "Assigned tasks fetched successfully.",
      tasks: tasksWithVolunteerStatus,
    });
  } catch (err) {
    console.error("Error fetching assigned tasks:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks.",
      error: err.message,
    });
  }
};

const getTaskCount = async (req, res) => {
  try {
    const { userId, roles } = req.user;

    // Validate roles
    if (!Array.isArray(roles) || !roles.includes("volunteer")) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Volunteer role required.",
      });
    }

    // Count tasks where user is in volunteers array
    const count = await VolunteerTask.countDocuments({ "volunteers.user": userId });

    res.status(200).json({
      success: true,
      message: "Volunteer task count fetched successfully.",
      count,
    });
  } catch (err) {
    console.error("Error fetching volunteer task count:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching task count.",
      error: err.message,
    });
  }
};

const getTaskCountByStatus = async (req, res) => {
  try {
    const { userId, roles } = req.user;

    // Validate roles
    if (!Array.isArray(roles) || !roles.includes("volunteer")) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Volunteer role required.",
      });
    }

    // Aggregate task counts by status
    const counts = await VolunteerTask.aggregate([
      {
        $match: { "volunteers.user": new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format counts to include all possible statuses
    const allStatuses = ["pending", "active", "completed", "cancelled"];
    const result = allStatuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    counts.forEach((item) => {
      result[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      message: "Volunteer task counts fetched successfully.",
      counts: result,
    });
  } catch (err) {
    console.error("Error fetching volunteer task counts by status:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching task counts.",
      error: err.message,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const userId = req.user.userId;

  // Validate action
  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action." });
  }

   // Map action to status
  const statusMap = {
    accept: "accepted",
    reject: "rejected"
  };

  const statusToUpdate = statusMap[action] || "pending";

  try {
    const updatedTask = await VolunteerTask.findOneAndUpdate(
      {
        _id: id,
        "volunteers.user": userId,
      },
      {
        $set: {
          "volunteers.$.status":statusToUpdate,
        },
      },
      { new: true }
    ).populate("volunteers.user", "firstName lastName");

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you're not assigned as a volunteer.",
      });
    }

       const volunteer = updatedTask.volunteers.find(
      (v) => v.user && v.user._id.toString() === userId
    );
    const volunteerName = volunteer?.user?.firstName || "A volunteer";

    const admins = await User.find({ roles: "admin" });

    const notifications = admins.map((admin,_id) => ({
      userId: admin._id,
      type: "volunteer-task",
      title: `Task ${statusToUpdate}`,
      message: `${volunteerName} has ${statusToUpdate} a task.`,
    }));

    await Notification.insertMany(notifications);

    const io = getIO();
    // Optional: Emit real-time via socket.io
    admins.forEach((admin) => {
      io.to(admin.userId).emit("notification", {
        title: `Task ${statusToUpdate}`,
        message: `${volunteerName} has ${statusToUpdate} a task.`,
      });
    });

    return res.status(200).json({
      success: true,
      message: `Task ${action}ed successfully.`,
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating volunteer task status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

//Delete Account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//Dealers Data
const getDonationsByDealer = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    // Must be authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Must have 'dealer' role
    if (!userRoles.includes("dealer")) {
      return res.status(403).json({ message: "Access denied: Dealers only" });
    }

    // Find donations assigned to the logged-in dealer
    const donations = await Donation.find({ dealer: userId })
      .populate("donor", "firstName email profileImage")
      .populate("dealer", "firstName email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Dealer donations fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching dealer donations:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getDonationById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];
    const { id } = req.params;

    // Must be authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Must be dealer
    if (!userRoles.includes("dealer")) {
      return res.status(403).json({ message: "Access denied: Dealers only" });
    }

    // Find donation by ID and dealer match
    const donation = await Donation.findOne({ _id: id, dealer: userId })
      .populate("donor", "firstName lastName email phone")
      .populate("dealer", "firstName email profileImage");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found or not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      donation,
    });
  } catch (err) {
    console.error("Error fetching donation by ID:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getPickupDonations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];
    // Must be authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // Must have 'dealer' role
    if (!userRoles.includes("dealer")) {
      return res.status(403).json({ message: "Access denied: Dealers only" });
    }

    const pickupStatuses = ["assigned", "in-progress", "picked-up"];

    // Count all pickup donations assigned to the current dealer
    const totalPickupCount = await Donation.countDocuments({
      status: { $in: pickupStatuses },
      dealer: userId,
    });

    // Fetch the pickup donations with donor details
    const pickupDonations = await Donation.find({
      status: { $in: pickupStatuses },
      dealer: userId,
    }).populate("donor", "firstName lastName email profileImage");

    return res.status(200).json({
      success: true,
      message: "Pickup donations fetched successfully",
      totalPickups: totalPickupCount,
      donations: pickupDonations,
    });
  } catch (error) {
    console.error("Error fetching pickup donations:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const user = req.user;
    if (!user || !user.roles.includes("dealer")) {
      return res.status(403).json({
        message: "Access denied: Only dealers can update donations",
      });
    }

    const dealerId = user.userId;

    const donation = await Donation.findById(id).populate("dealer");
    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    const allowedStatuses = ["in-progress", "picked-up", "donated"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Dealers can only update to: in-progress, picked-up, or donated.",
      });
    }

    // Check if the donation is assigned to the logged-in dealer
    if (donation.dealer?._id.toString() !== dealerId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this donation",
      });
    }

    // Update donation status and add activity log entry
    donation.status = status;
    donation.activityLog.push({
      action: status,
      by: donation.dealer._id,
      role: "dealer",
      note: note || `Dealer updated status to ${status}`,
    });

    await donation.save();

    // 🔔 Notify Donor
    const io = getIO();

    // 🔔 Notify Donor
    const donorId = donation.donor?._id?.toString();
    const dealerName = donation.dealer?.firstName || "Dealer";

    if (donorId) {
      const message = `Your donation has been marked as '${status}' by dealer ${dealerName}.`;
      const notification = await Notification.create({
        userId: donorId,
        message,
        type: "donation-status",
      });
      io.to(donorId).emit("newNotification", {
        message: notification.message,
        notificationId: notification._id,
      });
    }

    // 🔔 Notify Admins
    const admins = await User.find({ roles: "admin" }, "_id");
    const adminMessage = `Dealer ${dealerName} updated donation status to '${status}'.`;

    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin._id.toString(),
        message: adminMessage,
        type: "dealer-update",
      });
      io.to(admin._id.toString()).emit("newNotification", {
        message: notification.message,
        notificationId: notification._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation status updated by dealer",
      donation,
    });
  } catch (err) {
    console.error("Dealer status update error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const addPriceandweight = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, weight, notes } = req.body;

    const userId = req.user.userId;
    const roles = req.user.roles || [];

    // Must be authenticated and have dealer role
    const isDealer = Array.isArray(roles)
      ? roles.includes("dealer")
      : roles === "dealer";

    if (!isDealer) {
      return res.status(403).json({
        message: "Access denied: Only dealers can update donation price/weight",
      });
    }

    // Find donation and ensure it exists
    const donation = await Donation.findById(id).populate("dealer");
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Confirm donation is assigned to this dealer
    if (donation.dealer?._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this donation",
      });
    }

    // Require price and weight in request
    if (price === undefined || weight === undefined) {
      return res.status(400).json({
        message: "Price and weight are required",
      });
    }

    // Update donation fields
    donation.price = price;
    donation.weight = weight;
    if (notes !== undefined) donation.notes = notes;

    await donation.save();

     const io = getIO();
    const dealerName = donation.dealer?.firstName || "Dealer";

    // 🔔 Notify Donor
    const donorId = donation.donor?._id?.toString();
    if (donorId) {
      const message = `Dealer ${dealerName} updated your donation with price ₹${price} and weight ${weight}kg.`;
      const notification = await Notification.create({
        userId: donorId,
        message,
        type: "donation-update",
      });
      io.to(donorId).emit("newNotification", {
        message: notification.message,
        notificationId: notification._id,
      });
    }

    // 🔔 Notify Admins
    const admins = await User.find({ roles: "admin" }, "_id");
    const adminMessage = `Dealer ${dealerName} updated price ₹${price} and weight ${weight}kg for a donation.`;

    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin._id.toString(),
        message: adminMessage,
        type: "dealer-update",
      });
      io.to(admin._id.toString()).emit("newNotification", {
        message: notification.message,
        notificationId: notification._id,
      });
    

      return res.status(200).json({
        success: true,
        message: "Donation updated successfully",
        donation,
      });
    }
  } catch (err) {
    console.error("Update error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    // Must be authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // Must have 'dealer' role
    if (!userRoles.includes("dealer")) {
      return res.status(403).json({ message: "Access denied: Dealers only" });
    }

    // Only fetch donated pickups for this dealer
    const donatedStatus = ["donated", "processed", "recycled"];

    const totalDonatedCount = await Donation.countDocuments({
      status: donatedStatus,
      dealer: userId,
    });

    const donatedPickups = await Donation.find({
      status: donatedStatus,
      dealer: userId,
    })
      .populate("donor", "firstName lastName email profileImage")
      .populate("recycler", "firstName lastName email profileImage");

    return res.status(200).json({
      success: true,
      message: "Donated pickups fetched successfully",
      totalPickups: totalDonatedCount,
      donations: donatedPickups,
    });
  } catch (error) {
    console.error("Error fetching donated pickups:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//Sliders Image
const getSliders = async (req, res) => {
  try {
    console.log("Fetching sliders from database...");
    const sliders = await Slider.find();
    console.log("Sliders fetched:", sliders.length);
    res.status(200).json({
      success: true,
      message: "Sliders fetched successfully",
      sliders,
    });
  } catch (error) {
    console.error("Error in getSliders:", {
      success: false,
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Error fetching sliders",
      error: error.message,
    });
  }
};

const logoGet = async (req, res) => {
  try {
    console.log("Connecting to database...");
    const logo = await Logo.findOne().sort({ createdAt: -1 });
    if (!logo) {
      console.log("No logo found in the database");
      return res.status(404).json({ message: "No logo found" });
    }
    console.log("Logo fetched:", logo);
    res.status(200).json({
      success: true,
      message: "Logo fetched successfully",
      logo,
    });
  } catch (err) {
    console.error("Error fetching logo:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching logo",
      error: err.message,
    });
  }
};

//Gaudaan
const gaudaanForm = async (req, res) => {
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
    } = req.body;

    // Validate consent
    if (consent !== true && consent !== "true") {
      return res.status(400).json({ message: "Consent is required" });
    }

    // Validate required fields
    const requiredFields = {
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
        return res.status(400).json({ message: `${key} is required` });
      }
    }

    // Validate email and phone formats
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    // Validate animalRegisteredId if provided
    if (animalRegisteredId && animalRegisteredId.trim() === "") {
      return res
        .status(400)
        .json({ message: "Animal Registered ID cannot be empty if provided" });
    }

    const images = [];

    if (req.files) {
      for (const file of req.files) {
        const stream = Readable.from(file.buffer);
        const filename = `${Date.now()}-${file.originalname}`;

        const uploadStream = gfs.openUploadStream(filename, {
          contentType: file.mimetype,
        });

        await new Promise((resolve, reject) => {
          stream
            .pipe(uploadStream)
            .on("finish", () => {
              images.push({ url: `/file/${uploadStream.id}` }); // This is what you save
              resolve();
            })
            .on("error", reject);
        });
      }
    }

    const gaudaan = new Gaudaan({
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
      donor: req.user.userId,
    });

    await gaudaan.save();
    res
      .status(201)
      .json({ message: "Gaudaan record created successfully", data: gaudaan });
  } catch (error) {
    console.error("Error creating Gaudaan:", error);
    res
      .status(400)
      .json({ message: "Error creating record", error: error.message });
  }
};

const getGaudaanByUserId = async (req, res) => {
  try {
    const userId = req.user.userId;
    const roles = req.user.roles || [];

    if (!roles.includes("user")) {
      return res
        .status(403)
        .json({ message: "Access denied: Only users allowed" });
    }

    const records = await Gaudaan.find({ donor: userId })
      .populate("assignedVolunteer", "firstName lastName phone profileImage")
      .populate("shelterId", "name address phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Gaudaan records fetched successfully",
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching Gaudaan by user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getAssignedGaudaan = async (req, res) => {
  try {
    const volunteerId = req.user.userId;

    if (!volunteerId) {
      return res.status(400).json({ message: "Volunteer ID is required" });
    }

    const user = req.user;
    if (!user || !user.roles.includes("volunteer")) {
      return res.status(403).json({
        message: "Access denied: Only volunteers can update donations",
      });
    }

    const assignedGaudaan = await Gaudaan.find({
      assignedVolunteer: volunteerId,
    })
      .populate("assignedVolunteer", "firstName lastName email")
      .populate("donor", "firstName lastName phone profileImage");

    res.status(200).json({
      success: true,
      message: "Assigned Gaudaan fetched successfully",
      assignedGaudaan,
    });
  } catch (error) {
    console.error("Error fetching assigned Gaudaan:", error);
    res.status(200).json({ message: "Server error", error: error.message });
  }
};

const getAllShelters = async (req, res) => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: shelters.length, shelters });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching shelters",
      error: err.message,
    });
  }
};

const updategaudaanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, shelterId } = req.body;
    const userId = req.user?.userId;

    const roles = req.user.roles || [];
    if (!roles.includes("volunteer")) {
      return res
        .status(403)
        .json({ message: "Access denied: Only volunteers allowed" });
    }

    const allowedStatuses = [
      "unassigned",
      "assigned",
      "picked_up",
      "shelter",
      "dropped",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const donation = await Gaudaan.findById(id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // If status requires shelter info
    if (["shelter", "dropped"].includes(status)) {
      if (!shelterId) {
        return res
          .status(400)
          .json({ message: "shelterId is required for this status" });
      }

      // Optionally: Check if shelterId exists in the database
      const shelterExists = await Shelter.findById(shelterId);
      if (!shelterExists) {
        return res.status(404).json({ message: "Shelter not found" });
      }

      donation.shelterId = shelterId;
    }

    // Update status and history
    donation.status = status;
    donation.lastModifiedBy = userId || null;
    donation.statusHistory.push({
      status,
      changedBy: userId || null,
    });

    const updated = await donation.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      updated,
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating status",
      error: err.message,
    });
  }
};

// Rycycaler
const getRecyclers = async (req, res) => {
  try {
    const roles = req.user.roles;
    const recyclers = await User.find({ roles: "recycler" });
    if (!req.user || !roles.some((role) => req.user.roles.includes("dealer"))) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role(s): ${req.user?.roles?.join(", ")}`,
      });
    }
    res.status(200).json({ success: true, recyclers });
  } catch (error) {
    console.error("Error fetching recyclers:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const assignRecycler = async (req, res) => {
  const { id } = req.params;
  const { recyclerId } = req.body;
  const dealerId = req.user.userId;
  const userRoles = req.user.roles;

  try {
    if (!userRoles.includes("dealer")) {
      return res
        .status(403)
        .json({ message: "Only dealers can assign recycler" });
    }

    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.status !== "donated") {
      return res.status(400).json({
        message:
          "Donation must be marked as 'donated' before assigning recycler",
      });
    }

    if (String(donation.dealer) !== dealerId) {
      return res.status(403).json({
        message: "You can only assign recycler to your own donations",
      });
    }

    const recycler = await User.findById(recyclerId);

    if (!recycler || !recycler.roles.includes("recycler")) {
      return res.status(400).json({ message: "Invalid recycler" });
    }

    donation.recycler = recyclerId;
    donation.activityLog.push({
      action: "assigned",
      by: dealerId,
      note: "Recycler assigned by dealer",
    });

    await donation.save();

      // 🔔 Notify recycler via Socket.IO
     const io = getIO();
   
      io.to(recyclerId).emit("notification", {
        type: "donation-assigned",
        title: "New Donation Assigned",
        message: `A new donation has been assigned to you.`,
        donationId: donation._id,
      });
    


    res.status(200).json({
      success: true,
      message: "Recycler assigned successfully",
      donation,
    });
  } catch (err) {
    console.error("Assign Recycler Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getRecyclerDonations = async (req, res) => {
  const userId = req.user.userId;
  const roles = req.user.roles;

  if (!roles.includes("recycler")) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const donations = await Donation.find({
      recycler: userId,
      status: { $in: ["processed", "donated"] },
    })
      .populate("donor", "firstName lastName email phone")
      .populate("dealer", "firstName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Recycler fetch error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getRecycleDonations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const roles = req.user?.roles || [];

    if (!userId || !roles.includes("recycler")) {
      return res.status(403).json({ message: "Access denied: Recycler only" });
    }

    const donations = await Donation.find({
      recycler: userId,
      status: "recycled",
    })
      .populate("donor", "firstName lastName email phone")
      .populate("dealer", "firstName lastName email")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching recycler donations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const recyclerUpdateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const recyclerId = req.user.userId;

  try {
    const donation = await Donation.findById(id);

    if (!donation)
      return res.status(404).json({ message: "Donation not found" });

    if (String(donation.recycler) !== recyclerId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this donation" });
    }

    if (!["recycled", "processed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    donation.status = status;
    donation.activityLog.push({
      action: status,
      by: recyclerId,
      note,
    });

    await donation.save();

    const io = getIO();
   
    io.to(donation.dealer._id.toString()).emit("notification", {
      title: "Donation Updated",
      message: `Recycler updated donation status to '${status}'.`,
      donationId: donation._id,
      type: "donation-update",
      timestamp: new Date(),
    });

    res
      .status(200)
      .json({ success: true, message: "Donation updated", donation });
  } catch (err) {
    console.error("Update recycler status error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  volunteerSignup,
  signUpAuth,
  sendOTPAuth,
  signInAuth,
  forgotPassword,
  resetPassword,
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
  getAssignedGaudaan,
  getAllShelters,
  updategaudaanStatus,
  getRecyclers,
  assignRecycler,
  getRecyclerDonations,
  getRecycleDonations,
  recyclerUpdateStatus,
};
