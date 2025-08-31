import mongoose from 'mongoose';
import express, { Request, Response, NextFunction } from 'express';
import controller from '../controller/AuthController';
import authMiddleware from '../middleware/authMiddleware';
import multer from 'multer';

// Initialize router
const router = express.Router();

// Initialize GridFS
let gfs: mongoose.mongo.GridFSBucket;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
    bucketName: 'uploads',
  });
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed') as unknown as null, false);
    }
    cb(null, true);
  },
});

// Accept 1 profileImage + multiple images fields:
const uploadMultiple = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

const gupload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed') as unknown as null, false);
    }
    cb(null, true);
  },
});

// Routes

router.post('/volunteer', controller.volunteerSignup as any);

router.post('/signup', controller.signUpAuth as any);

router.post('/signin', controller.signInAuth as any);

// MSG91 OTP Send and Verify
router.post("/verify-otp", controller.verifyOtp as any);
router.post("/send-otp", controller.sendOtp as any);
router.post("/retry-otp", controller.retryOtp as any);


// Sliders
router.get('/sliders', controller.getSliders as any);

router.get('/logo', controller.logoGet as any);

// Forgot & Reset Password
router.post('/forgot-password', controller.forgotPassword as any);

router.post('/reset-password/:token', controller.resetPassword as any);

// App Passwoord reset
router.post("/sendOTP", controller.sendOTPapp as any);

router.post("/verify-otp", controller.otpVerify as any);

router.post("/reset-password", controller.resetPasswordApp as any);

// Users
router.get('/auth', authMiddleware, controller.fetchUsers as any);

router.get('/profile', authMiddleware, controller.getUserProfile as any);

router.patch('/profile', authMiddleware, uploadMultiple, controller.updateUserProfile as any);

router.get('/profile/image/:filename', controller.getProfileImage as any);

router.patch('/password', authMiddleware, controller.changePassword as any);

router.get('/impacts', controller.getImpacts as any);

// Volunteer by user
router.patch('/assign-volunteer', authMiddleware, controller.assignVolunteerRole as any);

// Tasks
router.get('/tasks', authMiddleware, controller.getMyAssignedTasks as any);

router.get('/volunteer-tasks/count', authMiddleware, controller.getTaskCount as any);

router.get('/volunteer-tasks/count-by-status', authMiddleware, controller.getTaskCountByStatus as any);

router.patch('/volunteer-tasks/:id/status', authMiddleware, controller.updateTaskStatus as any);

// Delete Account
router.delete('/delete-account', authMiddleware, controller.deleteAccount as any);

// Dealers Data
router.get('/donations/dealer', authMiddleware, controller.getDonationsByDealer as any);

router.get('/getpickupdonations', authMiddleware, controller.getPickupDonations as any);

router.patch('/donation/:id/status', authMiddleware, controller.updateDonationStatus as any);

router.patch('/donations/:id/update', authMiddleware, controller.addPriceandweight as any);

router.get('/donation/history', authMiddleware, controller.getHistory as any);

router.get('/donation/:id', authMiddleware, controller.getDonationById as any);

// Donations
router.post('/donate', authMiddleware, uploadMultiple, controller.createDonation as any);

router.get('/file/:id', controller.getDonationImage as any);

router.get('/donation', authMiddleware, controller.getDonations as any);

router.patch('/donation/:id/update', authMiddleware, controller.updateDonation as any);

router.get('/donations/count', authMiddleware, controller.getDonationsCount as any);

router.get('/donations/count-by-status', authMiddleware, controller.getDonationsCountByStatus as any);

router.get('/donations/:id', authMiddleware, controller.getDonationByIdForUser as any);

// Gaudaan
router.post('/gaudaan', authMiddleware, gupload.array('images', 2), controller.gaudaanForm as any);

router.get('/gaudaan/user', authMiddleware, controller.getGaudaanByUserId as any);

router.get('/assignedgaudaan', authMiddleware, controller.getAssignedGaudaan as any);

router.get('/shelters', authMiddleware, controller.getAllShelters as any);

router.patch('/updateStatus/:id', authMiddleware, controller.updategaudaanStatus as any);

router.get("/gaudaan/:id", authMiddleware, controller.getGaudaanById as any);

// Recycler
router.get('/recyclers', authMiddleware, controller.getRecyclers as any);

router.patch('/:id/assign-recycler', authMiddleware, controller.assignRecycler as any);

router.get('/recycler/assigned', authMiddleware, controller.getRecyclerDonations as any);

router.get('/recycle', authMiddleware, controller.getRecycleDonations as any);

router.patch('/:id/update-status', authMiddleware, controller.recyclerUpdateStatus as any);

// Google Login
router.post("/google", controller.googleLogin as any);

router.get("/user/:id", controller.getUserById as any);

router.patch("/complete-profile", controller.completeProfile as any);

router.post('/logout', controller.logoutAuth as any);

export default router;
