import Gaudaan from "../Model/GaudaanModel.js"
import User from "../Model/AuthModel.js"

export const gaudaanForm = async (req, res) => {
  try {
    const { name, email, phone, address, pickupDate, pickupTime, location } =
      req.body;

    // 🔍 Validate text fields
    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !pickupDate ||
      !pickupTime ||
      !location
    ) {
      return res.status(400).json({ success: false, message: "Name,email,phone,address,pickupDate,pickupTime,location are required" });
    }

    // 🔍 Validate location format
    let parsedLocation;
    try {
      parsedLocation = JSON.parse(location);
      if (
        typeof parsedLocation.lat !== "number" ||
        typeof parsedLocation.lng !== "number"
      ) {
        throw new Error("Invalid lat/lng");
      }
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid location format" });
    }

    // 🔍 Validate file uploads
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    if (req.files.length > 2) {
      return res.status(400).json({ success: false, message: "Maximum 2 images allowed" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalidFiles = req.files.filter(
      (file) => !allowedTypes.includes(file.mimetype)
    );

    if (invalidFiles.length > 0) {
      return res
        .status(400)
        .json({ message: "Only JPG, PNG, and WEBP files allowed" });
    }

    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
    // Convert 24-hour time to 12-hour format with AM/PM
    function convertToAmPm(timeStr) {
      const [hourStr, minute] = timeStr.split(":");
      const hour = parseInt(hourStr, 10);
      const suffix = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${suffix}`;
    }
    const formattedTime = convertToAmPm(pickupTime);

    const gaudaan = new Gaudaan({
      name,
      email,
      phone,
      address,
      pickupDate,
      pickupTime: formattedTime,
      location: parsedLocation,
      images: imagePaths,
    });

    await gaudaan.save();
    res.status(201).json({ success: true, message: "Gaudaan submitted", gaudaan });
  } catch (error) {
    console.error("Error in upload:", error);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
};

export const getGaudaanSubmissions = async (req, res) => {
  try {
    const data = await Gaudaan.find()
      .populate("assignedVolunteer", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Gaudaan submissions fetched successfully", data });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching data", error: err.message });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const role = req.query.role;
    if (!role) {
      return res.status(400).json({ message: "Role query param is required" });
    }

    const users = await User.find({ roles: role }).select(
      "firstName lastName email _id"
    );
    res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const assignVolunteer = async (req, res) => {
  try {
    const { gaudaanId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ message: "Volunteer ID is required" });
    }

    const updated = await Gaudaan.findByIdAndUpdate(
      gaudaanId,
      {
        assignedVolunteer: volunteerId,
        status: "assigned",
      },
      { new: true }
    ).populate("assignedVolunteer", "firstName lastName email phone");

    if (!updated) {
      return res.status(404).json({ message: "Gaudaan not found" });
    }

    res.status(200).json({
      success: true,
      message: "Volunteer assigned and donor notified",
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

// User
export const getAssignedGaudaan = async (req, res) => {
  try {
    const { volunteerId } = req.params;

    if (!volunteerId) {
      return res.status(400).json({ message: "Volunteer ID is required" });
    }

    const assignedGaudaan = await Gaudaan.find({
      assignedVolunteer: volunteerId,
    }).populate("assignedVolunteer", "firstName lastName email"); 

    res.status(200).json({ success: true, message: "Assigned Gaudaan fetched successfully", count: assignedGaudaan.length, data: assignedGaudaan });
  } catch (error) {
    console.error("Error fetching assigned Gaudaan:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updategaudaanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["assigned", "picked_up", "shelter", "dropped"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Gaudaan.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.status(200).json({ success: true, message: "Status updated successfully", data: updated });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const controller = {
  gaudaanForm,
  getGaudaanSubmissions,
  getUsersByRole,
  assignVolunteer,
  getAssignedGaudaan,
  updategaudaanStatus,
};

export default controller;