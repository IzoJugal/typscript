const Admin = require("../Model/AuthModel");
const User = require("../Model/AuthModel");
const Donation = require("../Model/DonationModel");
const Task = require("../Model/TaskModel");
const Slider = require("../Model/SliderModel");
const Impact = require("../Model/Impact");
const Logo = require("../Model/Logo");
const Gaudaan = require("../Model/GaudaanModel");
const Shelter = require("../Model/ShelterModel");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

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
        name: admin.firstName,
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
    const userId = req.user.userId;
    const { firstName, lastName, phone, email } = req.body;

    const admin = await Admin.findById(userId).select("-password -roles");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update other profile fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (email) admin.email = email;

    await admin.save();

    const updatedAdmin = admin.toObject();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
    console.log({ message: "Donation rejected and cancelled", donation });
    return res
      .status(200)
      .json({
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
      volunteer,
      address,
      status,
    } = req.body;

    // Basic required fields check
    if (
      !taskTitle ||
      !taskType ||
      !description ||
      !date ||
      !time ||
      !volunteer
    ) {
      return res.status(400).json({
        success: false,
        message:
          "taskTitle, taskType, description, date, and time volunteer are required.",
      });
    }

    // Validate date (must be a valid date and not in the past)
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use a valid date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Task date cannot be in the past.",
      });
    }

    // Validate time (AM/PM or 24hr)
    const timeRegex =
      /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?[0-9]|2[0-3]):[0-5][0-9]$/i;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM AM/PM or 24hr format.",
      });
    }

    const normalizedStatus = status?.toLowerCase();

    // Create task
    const newTask = new Task({
      taskTitle,
      taskType,
      description,
      date: parsedDate,
      time,
      volunteer,
      address,
      status: normalizedStatus,
    });

    await newTask.save();

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
      volunteer,
      address,
      status,
    } = req.body;

    // Fetch existing task
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Validate date if provided
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use a valid date.",
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        return res.status(400).json({
          success: false,
          message: "Task date cannot be in the past.",
        });
      }

      existingTask.date = parsedDate;
    }

    // Validate time format if provided
    if (time) {
      const timeRegex =
        /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?[0-9]|2[0-3]):[0-5][0-9]$/i;
      if (!timeRegex.test(time)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Use HH:MM AM/PM or 24hr format.",
        });
      }

      existingTask.time = time;
    }

    // Update other fields if present
    if (taskTitle) existingTask.taskTitle = taskTitle;
    if (taskType) existingTask.taskType = taskType;
    if (description) existingTask.description = description;
    if (volunteer) existingTask.volunteer = volunteer;
    if (address) existingTask.address = address;
    if (status) existingTask.status = status.toLowerCase();

    await existingTask.save();

    return res.status(200).json({
      success: true,
      message: "Volunteer task updated successfully.",
      task: existingTask,
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
      .populate("volunteer", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Volunteer tasks fetched successfully",
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks",
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
    const { firstName, lastName, phone, email, profileImage } = req.body;

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
    if (profileImage !== undefined) user.profileImage = profileImage;

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
    const { firstName, lastName, phone, email, profileImage } = req.body;

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
    if (profileImage !== undefined) dealer.profileImage = profileImage;

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
    res
      .status(500)
      .json({
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
    res
      .status(201)
      .json({
        success: true,
        message: "Slider created successfully",
        data: slider,
      });
  } catch (error) {
    console.error("Error in sliderImage:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        success: false,
        message: "Logo upload failed",
        error: err.message,
      });
  }
};

const logoGet = async (req, res) => {
  try {
    const logo = await Logo.findOne().sort({ createdAt: -1 });
    res
      .status(200)
      .json({
        success: true,
        message: "Logo fetched successfully",
        data: logo || null,
      });
  } catch (err) {
    res
      .status(500)
      .json({
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

    res
      .status(200)
      .json({
        success: true,
        message: "Impact counts updated successfully",
        data: updates,
      });
  } catch (error) {
    console.error("Error updating impact counts:", error);
    res
      .status(500)
      .json({
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
    res
      .status(200)
      .json({
        success: true,
        message: "Impacts fetched successfully",
        data: impacts,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch impacts",
        error: err.message,
      });
  }
};

const createShelter = async (req, res) => {
  try {
    const shelter = new Shelter(req.body);
    const saved = await shelter.save();
    res
      .status(201)
      .json({ success: true, message: "Shelter created", shelter: saved });
  } catch (err) {
    console.error("Shelter create error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating shelter",
        error: err.message,
      });
  }
};

const getAllShelters = async (req, res) => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: shelters.length, shelters });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching shelters",
        error: err.message,
      });
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

    const data = await Gaudaan.find()
    .populate("assignedVolunteer", "firstName lastName phone")
    .populate("shelterId", "name address phone")
    .sort({ createdAt: -1 }); 
    
    res
      .status(200)
      .json({
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

    const updated = await Gaudaan.findByIdAndUpdate(
      gaudaanId,
      { assignedVolunteer: volunteerId },
      { new: true }
    ).populate("assignedVolunteer", "firstName lastName email");

    res
      .status(200)
      .json({
        success: true,
        message: "Volunteer assigned successfully",
        gaudaan: updated,
      });
  } catch (error) {
    console.error("Error assigning volunteer:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Assignment failed",
        error: error.message,
      });
  }
};

module.exports = {
  getAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  PickedUpAndDonated,
  getTotalScrapedWeight,
  getTotalDonationValue,
  getUsersCounts,
  getDealersCounts,
  getVolunteerCounts,
  getPendingDonations,
  getHistory,
  getDealers,
  assignDealer,
  rejectDonation,
  getVolunteers,
  createVolunteerTask,
  updateVolunteerTask,
  getAllVolunteerTasks,
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
  getAllShelters,
  getGaudaanSubmissions,
  getVolunteerUsers,
  assignVolunteer,
};
