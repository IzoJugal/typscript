const Gaudaan = require("../Model/GaudaanModel");
const User = require("../Model/AuthModel");


const getGaudaanSubmissions = async (req, res) => {
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

const getUsersByRole = async (req, res) => {
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

const assignVolunteer = async (req, res) => {
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
const getAssignedGaudaan = async (req, res) => {
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

const updategaudaanStatus = async (req, res) => {
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

module.exports = {
  getGaudaanSubmissions,
  getUsersByRole,
  assignVolunteer,
  getAssignedGaudaan,
  updategaudaanStatus,
};
