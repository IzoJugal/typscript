import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import mongoose, { Document, Types } from "mongoose";
import { Admin } from "../Model/AuthModel";
import { User, IUser } from "../Model/AuthModel";
import Donation from "../Model/DonationModel";
import Task from "../Model/TaskModel";
import Slider from "../Model/SliderModel";
import Impact from "../Model/Impact";
import Logo from "../Model/Logo";
import Gaudaan from "../Model/GaudaanModel";
import Shelter from "../Model/ShelterModel";
import Contact from "../Model/ContactModel";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import Notification from "../Model/NotificationsModel";
import { getIO } from "../config/socket";
import admin from "../config/FirebaseAdmin";
import { sendEmail } from "../utils/sendEmail";
import { generateCertificate } from "../utils/generateCertificate";

// Interface for User Document
interface UserDocument extends Document {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  roles: string | string[];
  password?: string;
  profileImage?: string;
  isActive?: boolean;
  fcmTokens?: string[];
  notificationsEnabled?: boolean;
}

// Interface for Donation Document
interface DonationDocument extends Document {
  _id: Types.ObjectId;
  status: string;
  dealer?: Types.ObjectId;
  donor?: Types.ObjectId;
  weight?: string;
  price?: string;
  notes?: string;
  activityLog: { action: string; by: Types.ObjectId; role: string; note: string }[];
  pickupDate?: Date;
  pickupTime?: string;
  scrapType?: string;
}

// Interface for Task Document
interface TaskDocument extends Document {
  _id: Types.ObjectId;
  taskTitle: string;
  taskType: string;
  description: string;
  date: Date;
  time: string;
  volunteers: { user: Types.ObjectId; status: string }[];
  address?: string;
  status?: string;
}

// Interface for Gaudaan Document
interface GaudaanDocument extends Document {
  _id: Types.ObjectId;
  animalType: string;
  donor?: Types.ObjectId;
  assignedVolunteer?: Types.ObjectId;
  shelterId?: Types.ObjectId;
  status: string;
  rejectionReason?: string;
}

// Interface for Request with user
interface AuthRequest extends Request {
  user?: { userId: string; roles: string[] };
  files?: { [fieldname: string]: Express.Multer.File[] };
}

let gfs: mongoose.mongo.GridFSBucket;
const conn = mongoose.connection;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
    bucketName: "uploads",
  });
});

const formatDateTime = (date: Date | string, time: string): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  let formattedTime = time;
  if (!/[ap]m/i.test(time)) {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    formattedTime = `${hour12}:${m} ${ampm}`;
  }

  return `${day}-${month}-${year} at ${formattedTime}`;
};

const getAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    ) as { userId: string };

    const admin = await Admin.findById(decoded.userId).select("-password");
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
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
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const getAdminProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const admin = await Admin.findById(userId).select("-password");
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
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
      error: (error as Error).message,
    });
  }
};

const updateAdminProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!gfs) {
      throw new Error("GridFS is not initialized");
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { firstName, lastName, phone, email, notificationsEnabled } = req.body;

    const admin = await Admin.findById(userId).select("-password -roles");
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (email) admin.email = email;
    if (notificationsEnabled !== undefined) {
      admin.notificationsEnabled = notificationsEnabled === "true" || notificationsEnabled === true;
    }

    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];
      if (admin.profileImage) {
        const oldImage = await conn.db!.collection("uploads.files").findOne({
          filename: admin.profileImage,
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
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      admin.profileImage = filename;
    } else if (req.body.profileImage) {
      admin.profileImage = req.body.profileImage;
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: admin.toObject(),
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const getAdminProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!gfs) {
      throw new Error("GridFS is not initialized");
    }
    const filename = req.params.filename;
    const file = await conn.db!.collection("uploads.files").findOne({ filename });

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
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

const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: "Both currentPassword and newPassword are required",
      });
      return;
    }

    const admin = await Admin.findById(userId) as UserDocument;
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password || "");
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

// Dashboard Data
const PickedUpAndDonated = async (req: Request, res: Response): Promise<void> => {
  try {
    const allDonations = await Donation.find({})
      .populate("dealer")
      .populate("donor") as unknown as DonationDocument[];

    const grouped = allDonations.reduce((acc: { [key: string]: number }, donation) => {
      const status = donation.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalCount = allDonations.length;

    res.status(200).json({
      success: true,
      message: "Donation statuses fetched successfully",
      donationsByStatus: grouped,
      totalDonations: totalCount,
    });
  } catch (err) {
    console.error("Error fetching donation statuses:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching donation data",
      error: (err as Error).message,
    });
  }
};

const getTotalScrapedWeight = async (req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({
      success: true,
      message: "Total collected donation weight calculated successfully",
      totalWeight,
    });
  } catch (err) {
    console.error("Error calculating total collected donation weight:", err);
    res.status(500).json({
      success: false,
      message: "Server error while calculating total weight",
      error: (err as Error).message,
    });
  }
};

const getTotalDonationValue = async (req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({
      success: true,
      message: "Total donation value calculated successfully",
      totalValue,
    });
  } catch (err) {
    console.error("Error calculating total donation value:", err);
    res.status(500).json({
      success: false,
      message: "Server error while calculating total donation value",
      error: (err as Error).message,
    });
  }
};

const getUsersCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeUsers = await User.countDocuments({
      isActive: true,
      roles: { $in: ["user"] },
    });

    res.status(200).json({
      success: true,
      message: "Active users count fetched successfully",
      totalActiveUsers: activeUsers,
    });
  } catch (err) {
    console.error("Error counting users by role:", err);
    res.status(500).json({
      success: false,
      message: "Server error while counting users by role",
      error: (err as Error).message,
    });
  }
};

const getDealersCounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.roles.includes("admin")) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
      return;
    }

    const dealerCount = await User.countDocuments({
      roles: "dealer",
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Total active dealers count fetched successfully",
      totalActiveDealers: dealerCount,
    });
  } catch (err) {
    console.error("Error counting dealers:", err);
    res.status(500).json({
      success: false,
      message: "Server error while counting dealers",
      error: (err as Error).message,
    });
  }
};

const getVolunteerCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeUsers = await User.countDocuments({
      isActive: true,
      roles: { $in: ["volunteer"] },
    });

    res.status(200).json({
      success: true,
      message: "Active users count fetched successfully",
      totalActiveUsers: activeUsers,
    });
  } catch (err) {
    console.error("Error counting users by role:", err);
    res.status(500).json({
      success: false,
      message: "Server error while counting users by role",
      error: (err as Error).message,
    });
  }
};

const getPendingDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const donations = await Donation.find({ status: { $in: ["pending", "picked-up"] } })
      .populate("donor dealer")
      .sort({ createdAt: -1 }) as unknown as DonationDocument[];

    res.status(200).json({
      success: true,
      message: "Pending donations fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching pending donations:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending donations",
      error: (err as Error).message,
    });
  }
};

const getDonationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .populate("dealer", "firstName lastName email phone profileImage")
      .populate("donor", "firstName lastName email phone profileImage")
      .exec() as DonationDocument | null;

    if (!donation) {
      res.status(404).json({
        success: false,
        message: "Donation not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Donation fetched successfully",
      donation,
    });
  } catch (err) {
    console.error("Error fetching donation by ID:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching donation",
      error: (err as Error).message,
    });
  }
};

const getActiveDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const donations = await Donation.find({
      status: { $nin: ["donated", "cancelled"] },
    })
      .populate("donor", "firstName lastName phone profileImage")
      .populate("dealer", "firstName lastName phone profileImage")
      .sort({ createdAt: -1 }) as unknown as DonationDocument[];

    res.status(200).json({
      success: true,
      message: "Active donations fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Error fetching active donations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching donations",
      error: (error as Error).message,
    });
  }
};

const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const donations = await Donation.find({
      status: { $in: ["donated", "cancelled"] },
    })
      .populate("donor dealer")
      .sort({ createdAt: -1 }) as unknown as DonationDocument[];

    res.status(200).json({
      success: true,
      message: "Donation history fetched successfully",
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("Error fetching donation history:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching donation history",
      error: (err as Error).message,
    });
  }
};

const markDonationAsDonated = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const donation = await Donation.findById(req.params.id).populate<{ donor: IUser }>('donor', 'firstName lastName email');
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }

    if (donation.status !== "picked-up") {
      res.status(400).json({ message: "Donation must be in picked-up status to mark as donated" });
      return;
    }

    // ✅ Update donation status
    donation.status = "donated";
    donation.updatedAt = new Date();
    donation.activityLog.push({
      action: "donated",
      by: new mongoose.Types.ObjectId(req.user?.userId),
      note: "Donation marked as donated by admin",
      timestamp: new Date(),
    });

    await donation.save();

    // ✅ Generate certificate
    const donorName = `${donation.donor.firstName} ${donation.donor.lastName}`;
    const donationDate = new Date(donation.updatedAt).toLocaleDateString("en-GB");
    const certificatePath = path.join(__dirname, `../../certificates/donation_${donation._id}.pdf`);
    await generateCertificate(donorName, donation.scrapType, donationDate, donation.donor.email, certificatePath);

    // ✅ Send email with certificate
    const emailSubject = "Thank You for Your Donation!";
    const emailText = `Dear ${donorName},\n\nThank you for donating ${donation.scrapType}. Attached is your certificate of donation.\n\nBest regards,\nYour Organization`;
    const emailS = await sendEmail(donation.donor.email, emailSubject, emailText, [
      {
        filename: `Donation_Certificate_${donation._id}.pdf`,
        path: certificatePath,
      },
    ]);
    console.log("Email Sent:", emailS)

    // --------------------------------------
    // ✅ Notifications (DB + Socket + Push)
    // --------------------------------------
    const donorId = String(donation.donor._id);
    const message = `Thank you for donating "${donation.scrapType}". Your certificate has been emailed to you.`;

    // Save in DB
    const notification = await Notification.create({
      userId: donorId,
      message,
    });

    // --- Socket.io emit ---
    const io = getIO();
    io.to(donorId).emit("newNotification", {
      message,
      notificationId: notification._id,
      userId: donorId,
    });

    // --- Firebase push ---
    const donor = await User.findById(donorId).select("fcmTokens");
    if (donor?.fcmTokens?.length) {
      try {
        const tokens = donor.fcmTokens.map(tokenObj => tokenObj.token);
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: "Donation Completed 🎉",
            body: message,
          },
          data: {
            type: "donation-completed",
            donationId: String(donation._id),
            notificationId: String(notification._id),
            userId: donorId,
          },
        });
      } catch (err) {
        console.error("Error sending FCM push:", err);
      }
    }
    // Delete certificate after sending
    try {
      if (fs.existsSync(certificatePath)) {
        try {
          fs.unlinkSync(certificatePath);
          console.log("Certificate deleted successfully");
        } catch (err) {
          console.error("Failed to delete certificate:", err);
        }
      }
      console.log("Certificate file deleted:", certificatePath);
    } catch (err) {
      console.error("Failed to delete certificate file:", err);
    }

    res.status(200).json({
      success: true,
      message: "Donation marked as donated, certificate sent, and notifications delivered",
      donation,
    });
  } catch (error) {
    console.error("Error marking donation as donated:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Dealer Data
const getDealers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.roles.includes("admin")) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
      return;
    }

    const dealers = await User.find({ roles: "dealer" }).select("-password") as UserDocument[];
    const totalDealers = await User.countDocuments({ roles: "dealer" });

    if (!dealers.length) {
      res.status(404).json({
        success: false,
        message: "No dealers found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dealers fetched successfully",
      totalDealers,
      dealers,
    });
  } catch (err) {
    console.error("Error fetching dealers:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
};

const assignDealer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dealerId, assignedDealer, notes, status } = req.body;
    const { id } = req.params;

    const resolvedDealerId = dealerId || assignedDealer;
    const donation = await Donation.findById(id) as DonationDocument | null;
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }

    const dealer = await User.findById(resolvedDealerId).select(
      "firstName lastName email roles"
    ) as UserDocument | null;
    if (!dealer || !dealer.roles.includes("dealer")) {
      res.status(400).json({ message: "Invalid dealer ID" });
      return;
    }

    const allowedStatuses = ["assigned", "in-progress", "picked-up", "donated"];
    const finalStatus = status && allowedStatuses.includes(status) ? status : "assigned";

    donation.status = finalStatus;
    donation.dealer = resolvedDealerId;

    if (notes) {
      donation.notes = notes;
    }

    donation.activityLog.push({
      action: "assigned",
      by: new Types.ObjectId(req.user?.userId),
      role: req.user?.roles.includes("admin") ? "admin" : "user",
      note: notes || `Dealer assigned, status set to ${finalStatus}`,
    });

    await donation.save();

    await donation.populate("dealer", "firstName lastName email");
    const formattedDateTime = formatDateTime(donation.pickupDate!, donation.pickupTime!);

    const dealerMessage = `A new donation has been assigned to you. Pickup scheduled for ${formattedDateTime}.`;
    const donorMessage = `Your donation has been assigned to ${dealer.firstName} ${dealer.lastName}. Status: ${finalStatus}.`;

    const dealerNotification = await Notification.create({
      userId: resolvedDealerId,
      message: dealerMessage,
      link: `/pickup/${donation._id}`,
    });

    const donorNotification = await Notification.create({
      userId: donation.donor?._id,
      message: donorMessage,
      link: `/donationdetails`,
    });

    const io = getIO();

    // --- Socket.io notifications ---
    io.to(resolvedDealerId.toString()).emit("newNotification", {
      message: dealerMessage,
      notificationId: dealerNotification._id,
      link: dealerNotification.link,
      userId: resolvedDealerId.toString(),
    });

    const donorId: string = donation?.donor?._id?.toString()!;

    io.to(donorId).emit("newNotification", {
      message: donorMessage,
      notificationId: donorNotification._id,
      link: donorNotification.link,
      userId: donorId,
    });

    // --- Firebase push notifications ---
    // Notify Dealer
    const dealerUser = await User.findById(resolvedDealerId, "fcmTokens");
    // Notify Dealer
    if (dealerUser?.fcmTokens?.length) {
      try {
        const tokens = dealerUser.fcmTokens.map(fcmToken => fcmToken.token);
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: "New Donation Update",
            body: dealerMessage,
          },
          data: {
            type: "dealer-update",
            donationId: donation._id.toString(),
            link: dealerNotification.link ?? "",
            userId: resolvedDealerId.toString(),
            notificationId: String(dealerNotification._id),
          },
        });
      } catch (err) {
        console.error("Firebase push failed for dealer:", resolvedDealerId, err);
      }
    }

    // Notify Donor
    if (donorId && donorId !== "defaultRoomId") {
      const donorUser = await User.findById(donorId, "fcmTokens");
      if (donorUser?.fcmTokens?.length) {
        try {
          const tokens = donorUser.fcmTokens.map(fcmToken => fcmToken.token);
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: "Donation Update",
              body: donorMessage,
            },
            data: {
              type: "donor-update",
              donationId: donation._id.toString(),
              link: donorNotification.link ?? "",
              userId: donorId,
              notificationId: String(donorNotification._id),
            },
          });
        } catch (err) {
          console.error("Firebase push failed for donor:", donorId, err);
        }
      }
    }


    res.status(200).json({
      success: true,
      message: `Dealer assigned, status set to ${finalStatus}`,
      donation,
    });
  } catch (err) {
    console.error("Assign dealer error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
};

const rejectDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const donation = await Donation.findById(id) as DonationDocument | null;
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }

    donation.status = "cancelled";
    if (notes) {
      donation.notes = notes;
    }

    await donation.save();

    const donorId = donation.donor?._id;
    const message = `Your donation "${donation.scrapType}" has been rejected.`;

    // Save in DB
    const notification = await Notification.create({
      userId: donorId,
      message,
    });

    // --- Socket.io emit ---
    const io = getIO();
    if (donorId) {
      io.to(donorId.toString()).emit("newNotification", {
        message,
        notificationId: notification._id,
        userId: donorId.toString(),
      });
    }

    // --- Firebase push ---
    if (donorId) {
      // Get donor user with fcmToken
      const donor = await User.findById(donorId).select("fcmTokens");

      if (donor?.fcmTokens) {
        try {
          if (donor.fcmTokens && donor.fcmTokens.length > 0) {
            const tokens = donor.fcmTokens.map(tokenObj => tokenObj.token);
            await admin.messaging().sendEachForMulticast({
              tokens,
              notification: {
                title: "Donation Rejected",
                body: message,
              },
              data: {
                type: "donation-rejected",
                donationId: donation._id.toString(),
                notificationId: String(notification._id),
                userId: donorId.toString(),
              },
            });
          }


        } catch (error) {
          console.error(" Error sending FCM push:", error);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Donation rejected and cancelled",
      donation,
    });
  } catch (err) {
    console.error("Error rejecting donation:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
};

// Task Data
const getVolunteers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.roles.includes("admin")) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
      return;
    }

    const volunteers = await User.find({ roles: "volunteer" }).select("-password") as UserDocument[];
    const totalVolunteers = await User.countDocuments({ roles: "volunteer" });

    if (!volunteers.length) {
      res.status(404).json({
        success: false,
        message: "No volunteers found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Volunteers fetched successfully",
      totalVolunteers,
      volunteers,
    });
  } catch (err) {
    console.error("Error fetching volunteers:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
};

const createVolunteerTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskTitle, taskType, description, date, time, volunteers, address } = req.body;

    if (!taskTitle || !taskType || !description || !date || !time || !Array.isArray(volunteers) || volunteers.length === 0) {
      res.status(400).json({
        success: false,
        message: "Required fields: taskTitle, taskType, description, date, time, and at least one volunteer.",
      });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ success: false, message: "Invalid date format." });
      return;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      res.status(400).json({ success: false, message: "Date cannot be in the past." });
      return;
    }

    const timeRegex = /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?[0-9]|2[0-3]):[0-5][0-9]$/i;
    if (!timeRegex.test(time)) {
      res.status(400).json({ success: false, message: "Invalid time format." });
      return;
    }

    const volunteerIds = volunteers.map((v: any) => (typeof v === "object" ? v.user : v));
    const validVolunteers = await User.find({
      _id: { $in: volunteerIds },
      $or: [{ roles: "volunteer" }, { roles: { $all: ["user", "volunteer"] } }],
    }).select("_id");

    const validVolunteerIds = validVolunteers.map((v) => (v._id as Types.ObjectId).toString());
    if (validVolunteerIds.length !== volunteerIds.length) {
      res.status(400).json({
        success: false,
        message: "One or more volunteer IDs are invalid or unauthorized.",
      });
      return;
    }

    const volunteersWithStatus = validVolunteerIds.map((id) => ({
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
    }) as TaskDocument;

    await newTask.save();

    const io = getIO();

    for (const volId of validVolunteerIds) {
      // Create notification once
      const notif = await Notification.create({
        userId: volId,
        message: `You have been assigned a new task: ${taskTitle}`,
        link: `/tasksdetails`,
      });

      // Socket.io notification
      io.to(volId.toString()).emit("newNotification", {
        message: notif.message,
        notificationId: String(notif._id),
        link: notif.link,
        userId: volId.toString(),
      });

      // Firebase push notification
      const user = await User.findById(volId).select("fcmTokens");
      if (user?.fcmTokens?.length) {
        for (const fcmTokenObj of user.fcmTokens) {
          try {
            await admin.messaging().send({
              token: fcmTokenObj.token,
              notification: {
                title: "New Volunteer Task",
                body: `You have been assigned: ${taskTitle}`,
              },
              data: {
                taskId: newTask._id.toString(),
                type: "volunteer-task",
                notificationId: String(notif._id),
                userId: volId.toString(),
              },
            });
          } catch (fcmErr) {
            console.error("Error sending FCM push:", fcmErr);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Volunteer task created successfully.",
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating volunteer task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating task.",
      error: (error as Error).message,
    });
  }
};

const updateVolunteerTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { taskTitle, taskType, description, date, time, volunteers, address, status } = req.body;

    if (!taskId || !/^[0-9a-fA-F]{24}$/.test(taskId)) {
      res.status(400).json({ success: false, message: "Invalid task ID format." });
      return;
    }

    const existingTask = await Task.findById(taskId) as TaskDocument | null;
    if (!existingTask) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    if (status) {
      const validStatuses = ["pending", "active", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: pending, active, completed, cancelled.",
        });
        return;
      }
      existingTask.status = status;

      if (status === "completed" || status === "cancelled") {
        const io = getIO();

        for (const vol of existingTask.volunteers) {
          const notif = await Notification.create({
            userId: vol.user,
            message: `Task "${existingTask.taskTitle}" has been ${status}.`,
            link: "/tasksdetails",
          });

          // 🔹 Socket.io notification
          io.to(vol.user.toString()).emit("newNotification", {
            message: notif.message,
            userId: vol.user.toString(),
            notificationId: notif._id,
            link: notif.link,
          });

          // 🔹 Firebase Push Notification
          const volunteer = await User.findById(vol.user).select("fcmTokens");
          if (volunteer?.fcmTokens && volunteer.fcmTokens.length > 0) {
            const tokens = volunteer.fcmTokens.map(t => t.token);
            await admin.messaging().sendEachForMulticast({
              tokens,
              notification: {
                title: "Task Update",
                body: `Task "${existingTask.taskTitle}" has been ${status}.`,
              },
              data: {
                type: "task-update",
                taskId: existingTask._id.toString(),
                notificationId: String(notif._id),
                userId: vol.user.toString(),
                link: "/tasksdetails",
              },
            });
          }
        }

      }
    }

    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, message: "Invalid date format." });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        res.status(400).json({
          success: false,
          message: "Task date cannot be in the past.",
        });
        return;
      }

      existingTask.date = parsedDate;
    }

    if (time) {
      const timeRegex = /^((0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM))|([01]?[0-9]|2[0-3]):[0-5][0-9]$/i;
      if (!timeRegex.test(time)) {
        res.status(400).json({ success: false, message: "Invalid time format." });
        return;
      }
      existingTask.time = time;
    }

    if (taskTitle) existingTask.taskTitle = taskTitle.trim();
    if (taskType) existingTask.taskType = taskType.trim();
    if (description) existingTask.description = description.trim();
    if (address) existingTask.address = address.trim();

    if (volunteers) {
      if (!Array.isArray(volunteers) || volunteers.length === 0) {
        res.status(400).json({
          success: false,
          message: "Volunteers must be a non-empty array.",
        });
        return;
      }

      const volunteerIds = volunteers
        .map((v: any) => (typeof v === "object" ? v.user : v))
        .filter(Boolean);

      if (volunteerIds.some((id: string) => !/^[0-9a-fA-F]{24}$/.test(id))) {
        res.status(400).json({
          success: false,
          message: "One or more volunteer IDs are invalid.",
        });
        return;
      }

      const validVolunteers = await User.find({
        _id: { $in: volunteerIds },
        $or: [{ roles: "volunteer" }, { roles: { $all: ["user", "volunteer"] } }],
      }).select("_id");

      const validVolunteerIds = validVolunteers.map((v) => (v._id as Types.ObjectId).toString());
      if (validVolunteerIds.length !== volunteerIds.length) {
        res.status(400).json({
          success: false,
          message: "One or more volunteer IDs are invalid or unauthorized.",
        });
        return;
      }

      const existingVolunteerMap = new Map(
        existingTask.volunteers.map((vol) => [vol.user.toString(), vol.status])
      );
      existingTask.volunteers = validVolunteerIds.map((id) => ({
        user: new ObjectId(id),
        status: existingVolunteerMap.get(id) || "pending",
      }));

      const newVolunteers = validVolunteerIds.filter(
        (id) => !existingVolunteerMap.has(id)
      );
      if (newVolunteers.length > 0) {
        const io = getIO();

        for (const volId of newVolunteers) {
          const notif = await Notification.create({
            userId: volId,
            message: `You have been assigned a new task: ${existingTask.taskTitle}`,
            link: "/tasksdetails",
          });

          // 🔹 Socket.io real-time notification
          io.to(volId.toString()).emit("newNotification", {
            message: notif.message,
            notificationId: notif._id,
            userId: volId.toString(),
            link: notif.link,
          });

          // 🔹 Firebase Push Notification
          const volunteer = await User.findById(volId).select("fcmTokens");
          if (volunteer?.fcmTokens && volunteer.fcmTokens.length > 0) {
            const tokens = volunteer.fcmTokens.map(tokenObj => tokenObj.token);
            await admin.messaging().sendEachForMulticast({
              tokens,
              notification: {
                title: "New Task Assigned",
                body: `You have been assigned a new task: ${existingTask.taskTitle}`,
              },
              data: {
                type: "task-assignment",
                taskId: existingTask._id.toString(),
                notificationId: String(notif._id),
                userId: volId.toString(),
                link: "/tasksdetails",
              },
            });
          }
        }

      }
    }

    await existingTask.save();

    const updatedTask = await Task.findById(taskId)
      .populate("volunteers.user", "firstName lastName email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Volunteer task updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating volunteer task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating task.",
      error: (error as Error).message,
    });
  }
};

const getAllVolunteerTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).populate({
      path: "volunteers.user",
      select: "firstName lastName email profileImage",
    }) as TaskDocument[];

    res.status(200).json({
      success: true,
      message: "Volunteer tasks fetched successfully.",
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks.",
      error: (error as Error).message,
    });
  }
};

const getSingleTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "volunteers.user",
      "firstName phone profileImage"
    ) as TaskDocument | null;
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Task By ID Fetched", task });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

const deleteVolunteerTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    if (!taskId || !/^[0-9a-fA-F]{24}$/.test(taskId)) {
      res.status(400).json({ success: false, message: "Invalid task ID format." });
      return;
    }

    const existingTask = await Task.findById(taskId).populate(
      "volunteers.user",
      "firstName lastName email"
    ) as TaskDocument | null;
    if (!existingTask) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    if (existingTask.volunteers && existingTask.volunteers.length > 0) {
      const io = getIO();

      for (const vol of existingTask.volunteers) {
        const notif = await Notification.create({
          userId: vol.user._id,
          message: `Task "${existingTask.taskTitle}" has been deleted.`,
        });

        // 🔹 Socket.io emit
        io.to(vol.user._id.toString()).emit("newNotification", {
          message: notif.message,
          notificationId: notif._id,
          userId: vol.user._id.toString(),
        });

        // 🔹 Firebase push
        const volunteer = await User.findById(vol.user._id).select("fcmTokens");
        if (volunteer?.fcmTokens && volunteer.fcmTokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: volunteer.fcmTokens.map(tokenObj => tokenObj.token),
            notification: {
              title: "Task Deleted",
              body: `Task "${existingTask.taskTitle}" has been deleted.`,
            },
            data: {
              type: "task-deleted",
              taskId: existingTask._id.toString(),
              notificationId: String(notif._id),
              userId: vol.user._id.toString(),
            },
          });
        }
      }

    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: "Volunteer task deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting volunteer task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting task.",
      error: (error as Error).message,
    });
  }
};

// Users Data
const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({
      $and: [
        { roles: { $in: ["user", "volunteer"] } },
        { roles: { $ne: "admin" } },
      ],
    }).select("-password") as UserDocument[];

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
      error: (err as Error).message,
    });
  }
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const user = await User.findById(id) as UserDocument | null;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const updateUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, profileImage, isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const user = await User.findById(id) as UserDocument | null;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
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

      if (user.profileImage) {
        const oldImage = await conn.db!.collection("uploads.files").findOne({
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
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const deleteUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    if (typeof isActive !== "boolean") {
      res.status(400).json({ message: "isActive must be true or false" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password") as UserDocument | null;

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const message = `Your user account has been ${isActive ? "activated" : "deactivated"}.`;

    const notification = await Notification.create({
      userId: user._id,
      message,
      link: "/settings",
    });

    const io = getIO();

    // 🔹 Socket.io emit
    io.to(user._id.toString()).emit("newNotification", {
      message,
      notificationId: notification._id,
      userId: user._id.toString(),
      link: notification.link,
    });

    // 🔹 Firebase push
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: user.fcmTokens,
        notification: {
          title: "Account Status",
          body: message,
        },
        data: {
          type: "account-status",
          link: "/settings",
          notificationId: String(notification._id),
          userId: user._id.toString(),
        },
      });
    }


    res.status(200).json({
      success: true,
      message: `User is now ${isActive ? "active" : "inactive"}`,
      user,
    });
  } catch (error) {
    console.error("Error updating user active status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

// Dealer Data
const fetchDealers = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealer = await User.find({ roles: { $in: ["dealer"] } }).select("-password") as UserDocument[];

    if (!dealer.length) {
      res.status(404).json({ message: "Dealer not found" });
      return;
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
      error: (err as Error).message,
    });
  }
};

const getDealerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid dealer ID" });
      return;
    }

    const dealer = await User.findById(id).select("-password") as UserDocument | null;
    if (!dealer) {
      res.status(404).json({ message: "Dealer not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dealer fetched successfully",
      dealer,
    });
  } catch (error) {
    console.error("Error fetching dealer:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const updateDealerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.roles.includes("admin")) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
      return;
    }

    const { id } = req.params;
    const { firstName, lastName, phone, email, profileImage, isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid dealer ID" });
      return;
    }

    const dealer = await User.findById(id) as UserDocument | null;
    if (!dealer) {
      res.status(404).json({ message: "Dealer not found" });
      return;
    }

    if (firstName) dealer.firstName = firstName;
    if (lastName) dealer.lastName = lastName;
    if (phone) dealer.phone = phone;
    if (email) dealer.email = email;
    if (typeof isActive !== "undefined") {
      dealer.isActive = isActive;
    }

    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];

      if (dealer.profileImage) {
        const oldImage = await conn.db!.collection("uploads.files").findOne({
          filename: dealer.profileImage,
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
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const deleteDealerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid dealer ID" });
      return;
    }

    const deletedDealer = await User.findByIdAndDelete(id);
    if (!deletedDealer) {
      res.status(404).json({ message: "Dealer not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dealer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dealer:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

const toggleDealerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: "Invalid dealer ID" });
      return;
    }

    if (typeof isActive !== "boolean") {
      res.status(400).json({ message: "isActive must be true or false" });
      return;
    }

    const dealer = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password") as UserDocument | null;

    if (!dealer) {
      res.status(404).json({ message: "Dealer not found" });
      return;
    }

    const message = `Your dealer account has been ${isActive ? "activated" : "deactivated"}.`;

    const notification = await Notification.create({
      userId: dealer._id,
      message,
      link: "/settings",
    });

    const io = getIO();
    io.to(dealer._id.toString()).emit("newNotification", {
      message,
      notificationId: notification._id,
      userId: dealer._id.toString(),
      link: notification.link,
    });

    // 🔔 Firebase Push
    if (dealer.fcmTokens && dealer.fcmTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: dealer.fcmTokens,
        notification: {
          title: "Account Status",
          body: message,
        },
        data: {
          type: "dealer-account-status",
          link: "/settings",
          notificationId: String(notification._id),
          userId: dealer._id.toString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Dealer is now ${isActive ? "active" : "inactive"}`,
      dealer,
    });
  } catch (error) {
    console.error("Error updating dealer active status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

// Delete Account
const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.params.id || req.user?.userId;
    if (!req.user?.roles.includes("admin")) {
      res.status(403).json({ message: "Access denied. Admins only." });
      return;
    }

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);
    if (!deletedAdmin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
      error: (error as Error).message,
    });
  }
};

// Slider Images
const sliderImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const allFiles = files
      ? Object.values(files).flat()
      : [];

    if (allFiles.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    if (!files) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    const images = allFiles.map(file => ({
      url: `/uploads/${file.filename}`,
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
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      message: "Error uploading images",
      error: (error as Error).message,
    });
  }
};

const getSliders = async (req: Request, res: Response): Promise<void> => {
  try {
    const sliders = await Slider.find();
    res.json({
      success: true,
      message: "Sliders fetched successfully",
      data: sliders,
    });
  } catch (error) {
    console.error("Error in getSliders:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      message: "Error fetching sliders",
      error: (error as Error).message,
    });
  }
};

const uploadLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const oldLogo = await Logo.findOne();
    if (oldLogo) {
      const oldPath = path.join(__dirname, "..", oldLogo.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      await Logo.deleteMany();
    }

    const newLogo = new Logo({
      url: `/uploads/${file.filename}`,
      title: req.body.title || "Logo",
    });

    await newLogo.save();
    res.status(201).json({ success: true, message: "Logo uploaded", data: newLogo });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({
      success: false,
      message: "Logo upload failed",
      error: (err as Error).message,
    });
  }
};

const logoGet = async (req: Request, res: Response): Promise<void> => {
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
      error: (err as Error).message,
    });
  }
};

// Impacts Data
const saveImpacts = async (req: Request, res: Response): Promise<void> => {
  const updates: { label: string; count: string }[] = req.body;

  try {
    for (const update of updates) {
      const { label, count } = update;
      if (!label || !count) continue;

      const rawCount = Number(String(count).replace(/[^0-9]/g, ""));
      if (isNaN(rawCount)) continue;

      const formattedCount = rawCount.toLocaleString("en-IN");

      await Impact.findOneAndUpdate(
        { label },
        { $set: { count: formattedCount } },
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
      error: (error as Error).message,
    });
  }
};

const getImpacts = async (req: Request, res: Response): Promise<void> => {
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
      error: (err as Error).message,
    });
  }
};

// Shelters
const createShelter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, contactPerson, phone, email, address, capacity } = req.body;

    let profileImage: string | null = null;

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
      error: (err as Error).message,
    });
  }
};

const updateShelter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, address, capacity, currentOccupancy } = req.body;

    const shelter = await Shelter.findById(id);
    if (!shelter) {
      res.status(404).json({ success: false, message: "Shelter not found" });
      return;
    }

    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];
      const filename = `${Date.now()}-${file.originalname}`;

      if (shelter.profileImage) {
        const oldImage = await conn.db!.collection("uploads.files").findOne({
          filename: shelter.profileImage,
        });
        if (oldImage) {
          await gfs.delete(new mongoose.Types.ObjectId(oldImage._id));
        }
      }

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
      error: (err as Error).message,
    });
  }
};

const getAllShelters = async (req: Request, res: Response): Promise<void> => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: shelters.length, shelters });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching shelters",
      error: (err as Error).message,
    });
  }
};

const shelterToggle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const shelter = await Shelter.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!shelter) {
      res.status(404).json({ success: false, message: "Shelter not found" });
      return;
    }

    const io = getIO();
    const message = `Shelter "${shelter.name}" has been ${isActive ? "activated " : "deactivated "}`;

    const volunteers = await User.find({
      roles: { $all: ["user", "volunteer"] },
    }) as UserDocument[];

    for (const volunteer of volunteers) {
      const notification = await Notification.create({
        userId: volunteer._id,
        message,
        metadata: {
          shelterId: shelter._id,
          shelterName: shelter.name,
          status: isActive ? "active" : "inactive",
        },
        link: "/settings",
      });

      // 🔔 WebSocket
      io.to(volunteer._id.toString()).emit("newNotification", {
        userId: volunteer._id.toString(),
        notificationId: String(notification._id),
        message,
        link: notification.link,
      });

      // 🔔 Firebase Push
      if (volunteer.fcmTokens && volunteer.fcmTokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens: volunteer.fcmTokens,
          notification: {
            title: "Shelter Status Update",
            body: message,
          },
          data: {
            type: "shelter-status",
            link: "/settings",
            shelterId: String(shelter._id),
            notificationId: String(notification._id),
            userId: volunteer._id.toString(),
          },
        });
      }
    }


    res.json({
      success: true,
      message: "Shelter status updated and notifications sent",
      shelter,
    });
  } catch (err) {
    console.error("Error in shelterToggle:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteShelter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shelter = await Shelter.findByIdAndDelete(id);
    if (!shelter) {
      res.status(404).json({ success: false, message: "Shelter not found" });
      return;
    }

    res.json({ success: true, message: "Shelter deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Gaudaan Data
const getGaudaanSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = req.user?.roles || [];
    const isAdmin = Array.isArray(roles) ? roles.includes("admin") : roles === "admin";

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
      return;
    }

    const data = await Gaudaan.find({
      status: { $in: ["unassigned", "assigned", "picked_up"] },
    })
      .populate("assignedVolunteer", "firstName lastName phone profileImage")
      .populate("shelterId", "name address phone profileImage")
      .populate("donor", "firstName lastName phone profileImage")
      .sort({ createdAt: -1 }) as GaudaanDocument[];

    res.status(200).json({
      success: true,
      message: "Gaudaan submissions fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: (err as Error).message,
    });
  }
};

const getGaudaanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const gaudaan = await Gaudaan.findById(req.params.id)
      .populate("donor", "firstName lastName phone profileImage")
      .populate("assignedVolunteer", "firstName lastName phone profileImage") as GaudaanDocument | null;

    if (!gaudaan) {
      res.status(404).json({ message: "Gaudaan not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Gaudaan fetched by id successfully",
      gaudaan,
    });
  } catch (err) {
    console.error("Error fetching gaudaan:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
};

const getVolunteerUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ roles: { $in: ["volunteer"] } }).select(
      "firstName lastName email"
    ) as UserDocument[];

    res.status(200).json({
      success: true,
      message: "Volunteer users fetched successfully",
      count: users.length,
      volunteers: users,
    });
  } catch (err) {
    console.error("Error fetching volunteer users:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
};

const assignVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gaudaanId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      res.status(400).json({ message: "Volunteer ID is required" });
      return;
    }

    const gaudaan = await Gaudaan.findById(gaudaanId) as GaudaanDocument | null;
    if (!gaudaan) {
      res.status(404).json({ message: "Gaudaan not found" });
      return;
    }

    if (gaudaan.donor?.toString() === volunteerId) {
      res.status(400).json({
        message: "Volunteer cannot be the same as the donor",
      });
      return;
    }

    const updated = await Gaudaan.findByIdAndUpdate(
      gaudaanId,
      { assignedVolunteer: volunteerId, status: "assigned" },
      { new: true }
    ).populate("assignedVolunteer", "firstName lastName email") as GaudaanDocument | null;

    if (!updated) {
      res.status(404).json({ message: "Gaudaan not found" });
      return;
    }

    const io = getIO();

    // -------------------- Volunteer Notification --------------------
    const volunteerMsg = `You've been assigned to a Gaudaan pickup: ${updated.animalType}`;
    const volunteerNotification = await Notification.create({
      userId: volunteerId,
      message: volunteerMsg,
      link: "/assignedgaudaan",
    });

    // 🔔 WebSocket
    io.to(volunteerId.toString()).emit("newNotification", {
      userId: volunteerId.toString(),
      notificationId: String(volunteerNotification._id),
      message: volunteerMsg,
      link: volunteerNotification.link,
    });

    // 🔔 Firebase Push
    const volunteerUser = await User.findById(volunteerId) as UserDocument;
    if (volunteerUser?.fcmTokens && volunteerUser.fcmTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: volunteerUser.fcmTokens,
        notification: {
          title: "Gaudaan Assignment",
          body: volunteerMsg,
        },
        data: {
          type: "gaudaan-assignment",
          userId: volunteerId.toString(),
          notificationId: String(volunteerNotification._id),
          gaudaanId: updated._id.toString(),
          link: "/assignedgaudaan",
        },
      });
    }

    // -------------------- Donor Notification --------------------
    if (gaudaan.donor?._id) {
      const donorMsg = `Your Gaudaan (${updated.animalType}) has been assigned to a volunteer.`;
      const donorNotification = await Notification.create({
        userId: gaudaan.donor._id,
        message: donorMsg,
        link: "/gaudaan-details",
      });

      // 🔔 WebSocket
      io.to(gaudaan.donor._id.toString()).emit("newNotification", {
        userId: gaudaan.donor._id.toString(),
        notificationId: String(donorNotification._id),
        message: donorMsg,
        link: donorNotification.link,
      });

      // 🔔 Firebase Push
      const donorUser = await User.findById(gaudaan.donor._id) as UserDocument;
      if (donorUser?.fcmTokens && donorUser.fcmTokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens: donorUser.fcmTokens,
          notification: {
            title: "Gaudaan Update",
            body: donorMsg,
          },
          data: {
            type: "gaudaan-donor-update",
            userId: gaudaan.donor._id.toString(),
            notificationId: String(donorNotification._id),
            gaudaanId: updated._id.toString(),
            link: "/gaudaan-details",
          },
        });
      }
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
      error: (error as Error).message,
    });
  }
};

const rejectGaudaan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gaudaanId } = req.params;
    const { reason } = req.body;

    if (!gaudaanId) {
      res.status(400).json({ message: "Gaudaan ID is required" });
      return;
    }

    const updated = await Gaudaan.findByIdAndUpdate(
      gaudaanId,
      {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
      },
      { new: true }
    ) as GaudaanDocument | null;

    if (!updated) {
      res.status(404).json({ message: "Gaudaan not found" });
      return;
    }

    const message = `Your Gaudaan request has been rejected. ${reason ? "Reason: " + reason : ""}`;

    // Save in DB
    const notification = await Notification.create({
      userId: updated.donor,
      message,
    });

    // WebSocket
    const io = getIO();
    io.to(updated!.donor!.toString()).emit("newNotification", {
      message,
      notificationId: notification._id,
      userId: String(updated.donor),
    });

    // Firebase Push
    const donorUser = await User.findById(updated.donor) as UserDocument;
    if (donorUser?.fcmTokens && donorUser.fcmTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: donorUser.fcmTokens,
        notification: {
          title: "Gaudaan Request Rejected",
          body: message,
        },
        data: {
          type: "gaudaan-rejected",
          notificationId: String(notification._id),
          gaudaanId: updated._id.toString(),
          userId: String(updated.donor),
        },
      });
    }

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
      error: (error as Error).message,
    });
  }
};

const getGaudaanCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = req.user?.roles || [];
    const isAdmin = Array.isArray(roles) ? roles.includes("admin") : roles === "admin";

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
      return;
    }

    const data = await Gaudaan.find({
      status: { $in: ["dropped", "rejected"] },
    })
      .populate("assignedVolunteer", "firstName lastName phone profileImage")
      .populate("donor", "firstName lastName phone profileImage")
      .populate("shelterId", "name address phone profileImage")
      .sort({ createdAt: -1 }) as GaudaanDocument[];

    res.status(200).json({
      success: true,
      message: "Dropped or rejected Gaudaan submissions fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: (err as Error).message,
    });
  }
};

// Contacts
const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await Contact.find();
    if (!contacts.length) {
      res.status(404).json({ success: false, message: "Contact not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Contacts fetched", contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      res.status(404).json({ success: false, message: "Contact not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
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
  markDonationAsDonated,
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