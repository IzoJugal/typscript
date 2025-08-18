import express, { Request, Response } from "express";
import Notification from "../Model/NotificationsModel";
import {User} from "../Model/AuthModel";
import auth from "../middleware/authMiddleware";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const router = express.Router();

// Get all notifications for a user
router.get("/notifications", auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || user.notificationsEnabled === false) {
      return res.json({ success: true, message: "Notifications disabled", notifications: [] });
    }

    const notifications = await Notification.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ success: true, message: "Notifications", notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark one notification as read
router.patch("/:id/read", auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || user.notificationsEnabled === false) {
      return res.status(403).json({ success: false, message: "Notifications are disabled" });
    }

    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Clear all notifications
router.delete("/clear", auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || user.notificationsEnabled === false) {
      return res.status(403).json({ success: false, message: "Notifications are disabled" });
    }

    await Notification.deleteMany({ userId: req.user!.userId });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
