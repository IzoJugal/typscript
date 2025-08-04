const mongoose = require("mongoose");
const Admin = require("../Model/AuthModel");
const User = require("../Model/AuthModel");
const Donation = require("../Model/DonationModel");
const Task = require("../Model/TaskModel");
const Slider = require("../Model/SliderModel");
const Impact = require("../Model/Impact");
const Logo = require("../Model/Logo");
const Gaudaan = require("../Model/GaudaanModel");
const Shelter = require("../Model/ShelterModel");
const Contact = require("../Model/ContactModel");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const Notification = require("../Model/NotificationsModel");
const { getIO } = require("../config/socket");
const { log } = require("console");

let gfs;
const conn = mongoose.connection;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
});

const formatDateTime = (date, time) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  // Format time (already in "HH:MM AM/PM" or "HH:MM")
  let formattedTime = time;
  if (!/[ap]m/i.test(time)) {
    // Convert 24hr time to AM/PM
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    formattedTime = `${hour12}:${m} ${ampm}`;
  }

  return `${day}-${month}-${year} at ${formattedTime}`;
};

const getAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    const admin = await Admin.findById(decoded.userId).select("-password"); // Exclude password

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      admin: {
        id: admin._id,
        name: `${admin.firstName || ""} ${admin.lastName || ""}`.trim(),
        email: admin.email,
        roles: admin.roles,
      },
    });
  } catch (error) {
    console.error("Get admin error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Admin Data
const getAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const admin = await Admin.findById(userId).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      admin,
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    if (!gfs) {
      throw new Error("GridFS is not initialized");
    }

    const userId = req.user.userId;
    const { firstName, lastName, phone, email,notificationsEnabled } = req.body;

    const admin = await Admin.findById(userId).select("-password -roles");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update other profile fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (email) admin.email = email;
 if (notificationsEnabled !== undefined) {
      user.notificationsEnabled = notificationsEnabled === "true" || notificationsEnabled === true;
    }

    // Handle profile image with GridFS
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];

      // Delete previous profile image from GridFS if it exists
      if (admin.profileImage) {
        const oldImage = await conn.db.collection("uploads.files").findOne({
          filename: admin.profileImage,
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

      uploadStream.write(file.buffer);
      uploadStream.end();

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      admin.profileImage = filename;
    } else if (req.body.profileImage) {
      admin.profileImage = req.body.profileImage;
    }

    await admin.save();

    const updatedAdmin = admin.toObject();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getAdminProfileImage = async (req, res) => {
  try {
    if (!gfs) {
      throw new Error("GridFS is not initialized");
    }
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

    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    await admin.save();

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

//Daashboard Data
const PickedUpAndDonated = async (req, res) => {
  try {
    // Fetch all donations
    const allDonations = await Donation.find({})
      .populate("dealer")
      .populate("donor");

    // Group donations by status
    const grouped = allDonations.reduce((acc, donation) => {
      const status = donation.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Total donation count
    const totalCount = allDonations.length;

    return res.status(200).json({
      success: true,
      message: "Donation statuses fetched successfully",
      donationsByStatus: grouped,
      totalDonations: totalCount, // 👈 added this
    });
  } catch (err) {
    console.error("Error fetching donation statuses:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching donation data",
      error: err.message,
    });
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

const getTotalDonationValue = async (req, res) => {
  try {
    const result = await Donation.aggregate([
      {
        $match: {
          status: { $in: ["picked-up", "donated"] },
          price: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          priceDouble: { $toDouble: "$price" },
        },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$priceDouble" },
        },
      },
    ]);

    const totalValue = result[0]?.totalValue || 0;

    return res.status(200).json({
      success: true,
      message: "Total donation value calculated successfully",
      totalValue,
    });
  } catch (err) {
    console.error("Error calculating total donation value:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while calculating total donation value",
      error: err.message,
    });
  }
};

const getUsersCounts = async (req, res) => {
  try {
    const activeUsers = await User.countDocuments({
      isActive: true,
      roles: { $in: ["user"] },
    });

    return res.status(200).json({
      success: true,
      message: "Active users count fetched successfully",
      totalActiveUsers: activeUsers,
    });
  } catch (err) {
    console.error("Error counting users by role:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while counting users by role",
      error: err.message,
    });
  }
};

const getDealersCounts = async (req, res) => {
  try {
    const user = req.user;

    // 🔐 Only admins can access
    if (!user || !user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    // ✅ Count active dealers (assuming 'Dealer' is a user model filtered by role)
    const dealerCount = await User.countDocuments({
      roles: "dealer",
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: "Total active dealers count fetched successfully",
      totalActiveDealers: dealerCount,
    });
  } catch (err) {
    console.error("Error counting dealers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while counting dealers",
      error: err.message,
    });
  }
};

const getVolunteerCounts = async (req, res) => {
  try {
    const activeUsers = await User.countDocuments({
      isActive: true,
      roles: { $in: ["volunteer"] },
    });

    return res.status(200).json({
      success: true,
      message: "Active users count fetched successfully",
      totalActiveUsers: activeUsers,
    });
  } catch (err) {
    console.error("Error counting users by role:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while counting users by role",
      error: err.message,
    });
  }
};

const getPendingDonations = async (req, res) => {
  try {
    // Find all donations with status 'pending'
    const donations = await Donation.find({ status: "pending" })
      .populate("donor dealer") // populate refs if you want details about donor/dealer
      .sort({ createdAt: -1 }); // optional: sort newest first

    return res.status(200).json({
      success: true,
      message: "Pending donations fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching pending donations:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching pending donations",
      error: err.message,
    });
  }
};

const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .populate("dealer", "firstName lastName email phone profileImage")
      .populate("donor", "firstName lastName email phone profileImage")
      .exec();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation fetched successfully",
      donation,
    });
  } catch (err) {
    console.error("Error fetching donation by ID:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching donation",
      error: err.message,
    });
  }
};

const getActiveDonations = async (req, res) => {
  try {
    // Fetch donations where status is NOT 'donated' or 'cancelled'
    const donations = await Donation.find({
      status: { $nin: ["donated", "cancelled"] },
    })
      .populate("donor", "firstName lastName phone profileImage")
      .populate("dealer", "firstName lastName phone profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active donations fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Error fetching active donations:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching donations",
      error: error.message,
    });
  }
};

//History data
const getHistory = async (req, res) => {
  try {
    // Find all donations with status 'donated' or 'cancelled'
    const donations = await Donation.find({
      status: { $in: ["donated", "cancelled"] },
    })
      .populate("donor dealer") // populate donor and dealer details
      .sort({ createdAt: -1 }); // optional: newest first

    return res.status(200).json({
      success: true,
      message: "Donation history fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching donation history:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching donation history",
      error: err.message,
    });
  }
};

//Dealer Data
const getDealers = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Access control: Admins only
    if (!user || !user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    // 🔍 Find all users with 'dealer' in their roles array
    const dealers = await User.find({ roles: "dealer" }).select("-password");

    const totalDealers = await User.countDocuments({ roles: "dealer" });

    if (!dealers.length) {
      return res.status(404).json({
        success: false,
        message: "No dealers found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dealers fetched successfully",
      totalDealers,
      dealers,
    });
  } catch (err) {
    console.error("Error fetching dealers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const assignDealer = async (req, res) => {
  try {
    const { dealerId, assignedDealer, notes, status } = req.body;
    const { id } = req.params;

    // Accept either dealerId or assignedDealer
    const resolvedDealerId = dealerId || assignedDealer;
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Check if dealer exists and has the correct role
    const dealer = await User.findById(resolvedDealerId).select(
      "firstName lastName email roles"
    );
    if (!dealer || !dealer.roles.includes("dealer")) {
      return res.status(400).json({ message: "Invalid dealer ID" });
    }

    // Define allowed statuses
    const allowedStatuses = ["assigned", "in-progress", "picked-up", "donated"];
    const finalStatus =
      status && allowedStatuses.includes(status) ? status : "assigned";

    // Update fields
    donation.status = finalStatus;
    donation.dealer = resolvedDealerId;

    if (notes) {
      donation.notes = notes;
    }

    donation.activityLog.push({
      action: "assigned",
      by: req.user.userId,
      role: req.user.roles.includes("admin") ? "admin" : "user",
      note: notes || `Dealer assigned, status set to ${finalStatus}`,
    });

    await donation.save();

    await donation.populate("dealer", "firstName lastName email");
    const formattedDateTime = formatDateTime(
      donation.pickupDate,
      donation.pickupTime
    );

    const dealerMessage = `A new donation has been assigned to you. Pickup scheduled for ${formattedDateTime}.`;
    const donorMessage = `Your donation has been assigned to ${dealer.firstName} ${dealer.lastName}. Status: ${finalStatus}.`;

    // Notify Dealer
    const dealerNotification = await Notification.create({
      userId: resolvedDealerId,
      message: dealerMessage,
    });

    // Notify Donor
    const donorNotification = await Notification.create({
      userId: donation.donor._id,
      message: donorMessage,
    });

    // Emit Socket Events
    const io = getIO();
    io.to(resolvedDealerId.toString()).emit("newNotification", {
      message: dealerMessage,
      notificationId: dealerNotification._id,
    });

    io.to(donation.donor._id.toString()).emit("newNotification", {
      message: donorMessage,
      notificationId: donorNotification._id,
    });

    res.status(200).json({
      success: true,
      message: `Dealer assigned, status set to ${finalStatus}`,
      donation,
    });
  } catch (err) {
    console.error("Assign dealer error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const rejectDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    donation.status = "cancelled";

    if (notes) {
      donation.notes = notes;
    }

    await donation.save();

    // ✅ Send notification to donor
    const donorId = donation.donor?._id;
    const message = `Your donation "${donation.scrapType}" has been rejected.`;

    const notification = await Notification.create({
      userId: donorId,
      message,
    });

    // ✅ Emit socket notification
    const io = getIO();
    if (donorId) {
      io.to(donorId.toString()).emit("newNotification", {
        message,
        notificationId: notification._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation rejected and cancelled",
      donation,
    });
  } catch (err) {
    console.error("Error rejecting donation:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//Task Data
const getVolunteers = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Access control: Admins only
    if (!user || !user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    // 🔍 Find all users with 'volunteer' in their roles array
    const volunteers = await User.find({ roles: "volunteer" }).select(
      "-password"
    );

    const totalVolunteers = await User.countDocuments({ roles: "volunteer" });

    if (!volunteers.length) {
      return res.status(404).json({
        success: false,
        message: "No volunteers found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Volunteers fetched successfully",
      totalVolunteers,
      volunteers,
    });
  } catch (err) {
    console.error("Error fetching volunteers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const createVolunteerTask = async (req, res) => {
  try {
    const {
      taskTitle,
      taskType,
      description,
      date,
      time,
      volunteers,
      address,
    } = req.body;

    if (
      !taskTitle || !taskType || !description || !date || !time ||
      !Array.isArray(volunteers) || volunteers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields: taskTitle, taskType, description, date, time, and at least one volunteer.",
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ success: false, message: "Invalid date format." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return res.status(400).json({ success: false, message: "Date cannot be in the past." });
    }

    const timeRegex =
      /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?[0-9]|2[0-3]):[0-5][0-9]$/i;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ success: false, message: "Invalid time format." });
    }

    // Normalize volunteers to array of user IDs
    const volunteerIds = volunteers.map(v => typeof v === 'object' ? v.user : v);

    // Validate all volunteers
    const validVolunteers = await User.find({
      _id: { $in: volunteerIds },
      $or: [
        { roles: "volunteer" },
        { roles: { $all: ["user", "volunteer"] } },
      ],
    }).select("_id");

    const validVolunteerIds = validVolunteers.map(v => v._id.toString());
    if (validVolunteerIds.length !== volunteerIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more volunteer IDs are invalid or unauthorized.",
      });
    }

    const volunteersWithStatus = validVolunteerIds.map(id => ({
      user: id,
      status: "pending",
    }));

    const newTask = new Task({
      taskTitle,
      taskType,
      description,
      date: parsedDate,
      time,
      volunteers: volunteersWithStatus,
      address,
    });

    await newTask.save();

    // Create and send notifications
    const Notification = mongoose.model("Notification");
    const io = getIO();

    for (const volId of validVolunteerIds) {
      const notif = await Notification.create({
        userId: volId,
        message: `You have been assigned a new task: ${taskTitle}`,
      });

      io.to(volId.toString()).emit("newNotification", {
        message: notif.message,
        notificationId: notif._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Volunteer task created successfully.",
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating volunteer task:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating task.",
      error: error.message,
    });
  }
};

const updateVolunteerTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      taskTitle,
      taskType,
      description,
      date,
      time,
      volunteers, // Can be array of IDs or [{ user: id }]
      address,
      status,
    } = req.body;

    // Validate taskId
    if (!taskId || !/^[0-9a-fA-F]{24}$/.test(taskId)) {
      return res.status(400).json({ success: false, message: "Invalid task ID format." });
    }

    // Find existing task
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    // Update and validate status
    if (status) {
      const validStatuses = ["pending", "active", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: pending, active, completed, cancelled.",
        });
      }
      existingTask.status = status;

      // Optional: Notify volunteers if status changes to 'completed' or 'cancelled'
      if (status === "completed" || status === "cancelled") {
        const io = getIO();
        for (const vol of existingTask.volunteers) {
          const notif = await Notification.create({
            userId: vol.user,
            message: `Task "${existingTask.taskTitle}" has been ${status}.`,
          });
          io.to(vol.user.toString()).emit("newNotification", {
            message: notif.message,
            notificationId: notif._id,
          });
        }
      }
    }

    // Update and validate date
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) {
        return res.status(400).json({ success: false, message: "Invalid date format." });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        return res.status(400).json({ success: false, message: "Task date cannot be in the past." });
      }

      existingTask.date = parsedDate;
    }

    // Update and validate time
    if (time) {
      const timeRegex =
        /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?[0-9]|2[0-3]):[0-5][0-9]$/i;
      if (!timeRegex.test(time)) {
        return res.status(400).json({ success: false, message: "Invalid time format." });
      }
      existingTask.time = time;
    }

    // Update basic fields with sanitization
    if (taskTitle) existingTask.taskTitle = taskTitle.trim();
    if (taskType) existingTask.taskType = taskType.trim();
    if (description) existingTask.description = description.trim();
    if (address) existingTask.address = address.trim();

    // Update volunteers if provided
    if (volunteers) {
      if (!Array.isArray(volunteers) || volunteers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Volunteers must be a non-empty array.",
        });
      }

      const volunteerIds = volunteers.map((v) => (typeof v === "object" ? v.user : v)).filter(Boolean);

      if (volunteerIds.some((id) => !/^[0-9a-fA-F]{24}$/.test(id))) {
        return res.status(400).json({
          success: false,
          message: "One or more volunteer IDs are invalid.",
        });
      }

      const validVolunteers = await User.find({
        _id: { $in: volunteerIds },
        $or: [{ roles: "volunteer" }, { roles: { $all: ["user", "volunteer"] } }],
      }).select("_id");

      const validVolunteerIds = validVolunteers.map((v) => v._id.toString());

      if (validVolunteerIds.length !== volunteerIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more volunteer IDs are invalid or unauthorized.",
        });
      }

      // Preserve existing volunteer statuses if not reassigned
      const existingVolunteerMap = new Map(
        existingTask.volunteers.map((vol) => [vol.user.toString(), vol.status])
      );
      existingTask.volunteers = validVolunteerIds.map((id) => ({
        user: id,
        status: existingVolunteerMap.get(id) || "pending",
      }));

      // Notify new volunteers
      const newVolunteers = validVolunteerIds.filter(
        (id) => !existingVolunteerMap.has(id)
      );
      if (newVolunteers.length > 0) {
        const io = getIO();
        for (const volId of newVolunteers) {
          const notif = await Notification.create({
            userId: volId,
            message: `You have been assigned a new task: ${existingTask.taskTitle}`,
          });
          io.to(volId.toString()).emit("newNotification", {
            message: notif.message,
            notificationId: notif._id,
          });
        }
      }
    }

    await existingTask.save();

    // Populate task for response
    const updatedTask = await Task.findById(taskId)
      .populate("volunteers.user", "firstName lastName email")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Volunteer task updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating volunteer task:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating task.",
      error: error.message,
    });
  }
};

const getAllVolunteerTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "volunteers.user",
        select: "firstName lastName email profileImage", // Only fetch necessary fields
      });

    return res.status(200).json({
      success: true,
      message: "Volunteer tasks fetched successfully.",
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching tasks.",
      error: error.message,
    });
  }
};

const getSingleTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("volunteers.user", "firstName phone profileImage");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({success: true, message:"Task By ID Fetched", task });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteVolunteerTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Validate taskId
    if (!taskId || !/^[0-9a-fA-F]{24}$/.test(taskId)) {
      return res.status(400).json({ success: false, message: "Invalid task ID format." });
    }

    // Find existing task
    const existingTask = await Task.findById(taskId).populate("volunteers.user", "firstName lastName email");
    if (!existingTask) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    // Notify assigned volunteers
    if (existingTask.volunteers && existingTask.volunteers.length > 0) {
      const io = getIO();
      for (const vol of existingTask.volunteers) {
        const notif = await Notification.create({
          userId: vol.user._id,
          message: `Task "${existingTask.taskTitle}" has been deleted.`,
        });
        io.to(vol.user._id.toString()).emit("newNotification", {
          message: notif.message,
          notificationId: notif._id,
        });
      }
    }

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: "Volunteer task deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting volunteer task:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting task.",
      error: error.message,
    });
  }
};

//Users Data
const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      $and: [
        { roles: { $in: ["user", "volunteer"] } }, // include user or volunteer
        { roles: { $ne: "admin" } }, // exclude admin
      ],
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      total: users.length,
      users,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: err.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(200).json({ message: "Invalid user ID" });
    }

    // Find user by ID and update fields if provided
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, profileImage, isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user by ID and update fields if provided
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    
    if (typeof isActive !== "undefined") {
      user.isActive = isActive;
    }

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

      uploadStream.write(file.buffer);
      uploadStream.end();

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      user.profileImage = filename;
    } else if (req.body.profileImage) {
      user.profileImage = req.body.profileImage;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be true or false" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     // ✅ Notify the dealer
    const message = `Your user account has been ${isActive ? "activated" : "deactivated"}.`;
    const notification = await Notification.create({
      userId: user._id,
      message,
    });

    const io = getIO();
    io.to(user._id.toString()).emit("newNotification", {
      message,
      notificationId: notification._id,
    });

    res.status(200).json({
      success: true,
      message: `User is now ${isActive ? "active" : "inactive"}`,
      user,
    });
  } catch (error) {
    console.error("Error updating user active status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//Dealer Data
const fetchDealers = async (req, res) => {
  try {
    const dealer = await User.find({ roles: { $in: ["dealer"] } }).select(
      "-password"
    );

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Dealer fetched successfully",
      total: dealer.length,
      dealer,
    });
  } catch (err) {
    console.error("Error fetching dealer by ID:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dealer",
      error: err.message,
    });
  }
};

const getDealerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid dealer ID" });
    }

    const dealer = await User.findById(id).select("-password");
    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Dealer fetched successfully",
      dealer,
    });
  } catch (error) {
    console.error("Error fetching dealer:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateDealerById = async (req, res) => {
  try {
    // Assuming req.user or req.admin contains the logged-in user's info, including roles
    const user = req.user || req.admin;

    if (!user || !user.roles || !user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    const { id } = req.params;
    const { firstName, lastName, phone, email, profileImage,isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid dealer ID" });
    }

    // Find dealer by ID and update fields if provided
    const dealer = await User.findById(id);
    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    if (firstName) dealer.firstName = firstName;
    if (lastName) dealer.lastName = lastName;
    if (phone) dealer.phone = phone;
    if (email) dealer.email = email;

    if (typeof isActive !== "undefined") {
      user.isActive = isActive;
    }

    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];

      // Delete previous profile image from GridFS if it exists
      if (dealer.profileImage) {
        const oldImage = await conn.db.collection("uploads.files").findOne({
          filename: dealer.profileImage,
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

      uploadStream.write(file.buffer);
      uploadStream.end();

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      dealer.profileImage = filename;
    } else if (req.body.profileImage) {
      dealer.profileImage = req.body.profileImage;
    }

    await dealer.save();

    res.status(200).json({
      success: true,
      message: "Dealer updated successfully",
      dealer,
    });
  } catch (error) {
    console.error("Error updating dealer:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteDealerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid dealer ID" });
    }

    const deletedDealer = await User.findByIdAndDelete(id);

    if (!deletedDealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Dealer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dealer:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const toggleDealerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid dealer ID" });
    }

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be true or false" });
    }

    const dealer = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

     // ✅ Notify the dealer
    const message = `Your dealer account has been ${isActive ? "activated" : "deactivated"}.`;
    const notification = await Notification.create({
      userId: dealer._id,
      message,
    });

    const io = getIO();
    io.to(dealer._id.toString()).emit("newNotification", {
      message,
      notificationId: notification._id,
    });

    res.status(200).json({
      success: true,
      message: `Dealer is now ${isActive ? "active" : "inactive"}`,
      dealer,
    });
  } catch (error) {
    console.error("Error updating dealer active status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//Delete Account
const deleteAccount = async (req, res) => {
  try {
    const adminId = req.params.id || req.user._id;

    // Ensure the user is an admin
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
      error: error.message,
    });
  }
};

// Slider images
const sliderImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const images = req.files.map((file) => ({
      url: `/uploads/${file.filename}`, // Store relative path
      title: req.body.title,
    }));

    const slider = new Slider({ images });
    await slider.save();
    res.status(201).json({
      success: true,
      message: "Slider created successfully",
      data: slider,
    });
  } catch (error) {
    console.error("Error in sliderImage:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Error uploading images",
      error: error.message,
    });
  }
};

const getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find();
    res.json({
      success: true,
      message: "Sliders fetched successfully",
      data: sliders,
    });
  } catch (error) {
    console.error("Error in getSliders:", {
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

const uploadLogo = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // Delete previous logo if it exists
    const oldLogo = await Logo.findOne();
    if (oldLogo) {
      const oldPath = path.join(__dirname, "..", oldLogo.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      await Logo.deleteMany();
    }

    // Save new logo
    const newLogo = new Logo({
      url: `/uploads/${file.filename}`,
      title: req.body.title || "Logo",
    });

    await newLogo.save();
    res
      .status(201)
      .json({ success: true, message: "Logo uploaded", data: newLogo });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({
      success: false,
      message: "Logo upload failed",
      error: err.message,
    });
  }
};

const logoGet = async (req, res) => {
  try {
    const logo = await Logo.findOne().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Logo fetched successfully",
      data: logo || null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching logo",
      error: err.message,
    });
  }
};

// Impacts Data
const saveImpacts = async (req, res) => {
  const updates = req.body;

  try {
    for (const update of updates) {
      const { label, count } = update;
      if (!label || !count) continue;

      const rawCount = Number(String(count).replace(/[^0-9]/g, ""));
      if (isNaN(rawCount)) continue;

      const formattedCount = rawCount.toLocaleString("en-IN");

      await Impact.findOneAndUpdate(
        { label },
        {
          $set: {
            count: formattedCount,
          },
        },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Impact counts updated successfully",
      data: updates,
    });
  } catch (error) {
    console.error("Error updating impact counts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Fetch all impact stats
const getImpacts = async (req, res) => {
  try {
    const impacts = await Impact.find();
    res.status(200).json({
      success: true,
      message: "Impacts fetched successfully",
      data: impacts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch impacts",
      error: err.message,
    });
  }
};

//Shelters
const createShelter = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, capacity } = req.body;

    let profileImage = null;

    // Upload profile image if present (from multer with memoryStorage)
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];
      const filename = `${Date.now()}-${file.originalname}`;

      const uploadStream = gfs.openUploadStream(filename, {
        contentType: file.mimetype,
      });

      uploadStream.write(file.buffer);
      uploadStream.end();

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      profileImage = filename;
    } else if (req.body.profileImage) {
      // If image URL or GridFS filename passed directly (optional)
      profileImage = req.body.profileImage;
    }

    const newShelter = new Shelter({
      name,
      contactPerson,
      phone,
      email,
      address,
      capacity,
      profileImage,
    });

    await newShelter.save();

    res.status(201).json({ success: true, shelter: newShelter });
  } catch (err) {
    console.error("Error creating shelter:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create shelter",
      error: err.message,
    });
  }
};

const updateShelter = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, contactPerson, phone, address, capacity, currentOccupancy } =
      req.body;

    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res
        .status(404)
        .json({ success: false, message: "Shelter not found" });
    }

    // Image update
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];
      const filename = `${Date.now()}-${file.originalname}`;

      // Delete old image from GridFS
      if (shelter.profileImage) {
        const oldImage = await conn.db.collection("uploads.files").findOne({
          filename: shelter.profileImage,
        });

        if (oldImage) {
          await gfs.delete(new mongoose.Types.ObjectId(oldImage._id));
        }
      }

      // Upload new image to GridFS
      const uploadStream = gfs.openUploadStream(filename, {
        contentType: file.mimetype,
      });

      uploadStream.write(file.buffer);
      uploadStream.end();

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      shelter.profileImage = filename;
    }

    // Update other fields
    shelter.name = name ?? shelter.name;
    shelter.contactPerson = contactPerson ?? shelter.contactPerson;
    shelter.phone = phone ?? shelter.phone;
    shelter.address = address ?? shelter.address;
    shelter.capacity = capacity ?? shelter.capacity;
    shelter.currentOccupancy = currentOccupancy ?? shelter.currentOccupancy;

    await shelter.save();

    res.status(200).json({ success: true, shelters: shelter });
  } catch (err) {
    console.error("Error updating shelter:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update shelter",
      error: err.message,
    });
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

const shelterToggle = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const shelter = await Shelter.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!shelter) {
      return res
        .status(404)
        .json({ success: false, message: "Shelter not found" });
    }

       const io = getIO();
    const message = `Shelter "${shelter.name}" has been ${isActive ? "activated ✅" : "deactivated ❌"}.`;

    // ✅ Notify all dealers
    const dealers = await User.find({ roles: "dealer" });

   const notificationPromises = dealers.map(async (dealer) => {
  const notification = await Notification.create({
    userId: dealer._id,
    message,
    metadata: {
      shelterId: shelter._id,
      shelterName: shelter.name,
      status: isActive ? "active" : "inactive",
    },
  });

 

  return notification; // ✅ now returns a value
});

   await Promise.all(notificationPromises)

   dealers.forEach((dealer) => {
  for (let [id, socket] of io.of("/").sockets) {
    io.to(dealer._id.toString()).emit("newNotification", {
    message,
    notificationId: notificationPromises._id,
  });
  }
});

   console.log(await Promise.all(notificationPromises));

    res.json({ success: true, message: "Shelter status updated", shelter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteShelter = async (req, res) => {
  try {
    const { id } = req.params;

    const shelter = await Shelter.findByIdAndDelete(id);

    if (!shelter) {
      return res
        .status(404)
        .json({ success: false, message: "Shelter not found" });
    }

    res.json({ success: true, message: "Shelter deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Gaudaan Data
const getGaudaanSubmissions = async (req, res) => {
  try {
    const roles = req.user.roles || [];

    const isAdmin = Array.isArray(roles)
      ? roles.includes("admin")
      : roles === "admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    const data = await Gaudaan.find({
      status: { $in: ["unassigned", "assigned", "picked_up"] },
    })
      .populate("assignedVolunteer", "firstName lastName phone profileImage")
      .populate("shelterId", "name address phone profileImage")
      .populate("donor", "firstName LastName phone profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Gaudaan submissions fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: err.message,
    });
  }
};

const getGaudaanById = async (req, res) => {
  try {
    const gaudaan = await Gaudaan.findById(req.params.id)
      .populate("donor", "firstName LastName phone profileImage")
      .populate("assignedVolunteer", "firstName LastName phone profileImage");

    if (!gaudaan) {
      return res.status(404).json({ message: "Gaudaan not found" });
    }
    res.status(200).json({
      success: true,
      message: "Gaudaan fetched by id successfully",
      gaudaan,
    });
  } catch (err) {
    console.error("Error fetching gaudaan:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getVolunteerUsers = async (req, res) => {
  try {
    const users = await User.find({ roles: { $in: ["volunteer"] } }).select(
      "firstName lastName email"
    );

    res.status(200).json({
      success: true,
      message: "Volunteer users fetched successfully",
      count: users.length,
      volunteers: users,
    });
  } catch (err) {
    console.error("Error fetching volunteer users:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const assignVolunteer = async (req, res) => {
  try {
    const { gaudaanId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ message: "Volunteer ID is required" });
    }

    const gaudaan = await Gaudaan.findById(gaudaanId);
    if (!gaudaan) {
      return res.status(404).json({ message: "Gaudaan not found" });
    }

    // 🚫 Prevent assigning donor as volunteer
    if (gaudaan.donor?.toString() === volunteerId) {
      return res.status(400).json({
        message: "Volunteer cannot be the same as the donor",
      });
    }

    const updated = await Gaudaan.findByIdAndUpdate(
      gaudaanId,
      { assignedVolunteer: volunteerId, status: "assigned" },
      { new: true }
    ).populate("assignedVolunteer", "firstName lastName email");

      const io = getIO();

    // ✅ Notify the Volunteer
    const volunteerMsg = `You've been assigned to a Gaudaan pickup: ${updated.animalType}`;
    const volunteerNotification = await Notification.create({
      userId: volunteerId,
      message: volunteerMsg,
    });
    io.to(volunteerId.toString()).emit("newNotification", {
      message: volunteerMsg,
      notificationId: volunteerNotification._id,
    });

    // ✅ Notify the Donor (if exists)
    if (gaudaan.donor?._id) {
      const donorMsg = `Your Gaudaan (${updated.animalType}) has been assigned to a volunteer.`;
      const donorNotification = await Notification.create({
        userId: gaudaan.donor._id,
        message: donorMsg,
      });
      io.to(gaudaan.donor._id.toString()).emit("newNotification", {
        message: donorMsg,
        notificationId: donorNotification._id,
      });
    }
    res.status(200).json({
      success: true,
      message: "Volunteer assigned successfully",
      gaudaan: updated,
    });
  } catch (error) {
    console.error("Error assigning volunteer:", error);
    res.status(500).json({
      success: false,
      message: "Assignment failed",
      error: error.message,
    });
  }
};

const rejectGaudaan = async (req, res) => {
  try {
    const { gaudaanId } = req.params;
    const { reason } = req.body;

    if (!gaudaanId) {
      return res.status(400).json({ message: "Gaudaan ID is required" });
    }

    const updated = await Gaudaan.findByIdAndUpdate(
      gaudaanId,
      {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Gaudaan not found" });
    }

    // Optional: Notify user
    const message = `Your Gaudaan request has been rejected. ${
      reason ? "Reason: " + reason : ""
    }`;
    await Notification.create({
      userId: updated.donor,
      message,
    });

    const io = getIO();
    io.to(updated.donor.toString()).emit("newNotification", {
      message,
    });

    res.status(200).json({
      success: true,
      message: "Gaudaan rejected successfully",
      gaudaan: updated,
    });
  } catch (error) {
    console.error("Error rejecting Gaudaan:", error);
    res.status(500).json({
      success: false,
      message: "Rejection failed",
      error: error.message,
    });
  }
};

const getGaudaanCR = async (req, res) => {
  try {
    const roles = req.user.roles || [];

    const isAdmin = Array.isArray(roles)
      ? roles.includes("admin")
      : roles === "admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    // ✅ Fetch only 'dropped' and 'rejected' gaudaans
    const data = await Gaudaan.find({
      status: { $in: ["dropped", "rejected"] },
    })
      .populate("assignedVolunteer", "firstName lastName phone profileImage")
      .populate("donor", "firstName lastName phone profileImage")
      .populate("shelterId", "name address phone profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Dropped or rejected Gaudaan submissions fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: err.message,
    });
  }
};


//contacts
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    if (!contacts) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    res.status(200).json({ success: true, message: "Contacts fetched",contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  getAdmin,
  getAdminProfile,
  updateAdminProfile,
  getAdminProfileImage,
  changePassword,
  PickedUpAndDonated,
  getTotalScrapedWeight,
  getTotalDonationValue,
  getUsersCounts,
  getDealersCounts,
  getVolunteerCounts,
  getPendingDonations,
  getDonationById,
  getActiveDonations,
  getHistory,
  getDealers,
  assignDealer,
  rejectDonation,
  getVolunteers,
  createVolunteerTask,
  updateVolunteerTask,
  getAllVolunteerTasks,
  getSingleTask,
  deleteVolunteerTask,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  toggleUserStatus,
  fetchDealers,
  getDealerById,
  updateDealerById,
  deleteDealerById,
  toggleDealerStatus,
  deleteAccount,
  sliderImage,
  getSliders,
  uploadLogo,
  logoGet,
  saveImpacts,
  getImpacts,
  createShelter,
  updateShelter,
  getAllShelters,
  shelterToggle,
  deleteShelter,
  getGaudaanSubmissions,
  getGaudaanById,
  getVolunteerUsers,
  assignVolunteer,
  rejectGaudaan,
  getGaudaanCR,
  getContacts,
  deleteContact,
};
