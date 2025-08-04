const express = require("express");
const router = express.Router();
const Notification = require("../Model/NotificationsModel");
const User = require("../Model/AuthModel");
const auth = require("../middleware/authMiddleware");

// Get all notifications for a user
router.get("/notifications", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user || user.notificationsEnabled === false) {
    return res.json({ success: true, message: "Notifications disabled", notifications: [] });
  }

  const notifications = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, message: "Notifications", notifications });
});

// Mark one as read
router.patch("/:id/read", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user || user.notificationsEnabled === false) {
    return res.status(403).json({ success: false, message: "Notifications are disabled" });
  }

  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

// Clear all
router.delete("/clear", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user || user.notificationsEnabled === false) {
    return res.status(403).json({ success: false, message: "Notifications are disabled" });
  }

  await Notification.deleteMany({ userId: req.user.userId });
  res.json({ success: true });
});

module.exports = router;
