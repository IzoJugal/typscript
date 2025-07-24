const express = require("express");
const router = express.Router();
const controller = require("../controller/AuthController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// Accept 1 profileImage + multiple images fields:
const uploadMultiple = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "images", maxCount: 10 }, // max 10 images (adjust as needed)
]);


router.route("/volunteer").post(controller.volunteerSignup);

router.route("/signup").post(controller.signUpAuth);

router.route("/send-otp").post(controller.sendOTPAuth);

router.route("/signin").post(controller.signInAuth);

//Sliders
router.route('/sliders').get( controller.getSliders); 

router.get("/logo", controller.logoGet);


//Forgot & Reset Password
router.route("/forgot-password").post(controller.forgotPassword);

router.route("/reset-password/:token").post(controller.resetPassword);

//Users
router.route("/auth").get(authMiddleware, controller.fetchUsers);

router.route("/profile").get(authMiddleware, controller.getUserProfile);

router.route("/profile").patch(authMiddleware, uploadMultiple, controller.updateUserProfile);

router.route("/password").patch(authMiddleware, controller.changePassword);

// router.route("/volunteers/total").get(authMiddleware, controller.getTotalVolunteers);

// router.route("/count-city").get(authMiddleware, controller.getTotalCities);

// router.route("/count-scraped").get(authMiddleware, controller.getTotalScrapedWeight);

router.route("/impacts").get( controller.getImpacts);

//Donations
router.route("/donate").post(authMiddleware, uploadMultiple, controller.createDonation);

router.route("/donation").get(authMiddleware, controller.getDonations);

router.route("/donation/:id/update").patch(authMiddleware, controller.updateDonation);

router.route("/donations/count").get(authMiddleware, controller.getDonationsCount);

router.route("/donations/count-by-status").get(authMiddleware, controller.getDonationsCountByStatus);

//Volunteer by user
router.route("/assign-volunteer").patch(authMiddleware, controller.assignVolunteerRole);

//Tasks
router.route("/tasks").get(authMiddleware, controller.getMyAssignedTasks);

router.route("/volunteer-tasks/count").get(authMiddleware, controller.getTaskCount);

router.route("/volunteer-tasks/count-by-status").get(authMiddleware, controller.getTaskCountByStatus);

router.route("/volunteer-tasks/:id/status").patch(authMiddleware, controller.updateTaskStatus);

//Delete Account
router.route("/delete-account").delete(authMiddleware, controller.deleteAccount);

//Dealers Data
router.route("/donations/dealer").get(authMiddleware,controller.getDonationsByDealer);

router.route("/getpickupdonations").get(authMiddleware, controller.getPickupDonations);

router.route("/donation/:id/status").patch(authMiddleware,controller.updateDonationStatus);

router.route("/donations/:id/update").patch(authMiddleware, controller.addPriceandweight);

//Gaudaan
router.route("/assigned").get(authMiddleware, controller.getAssignedGaudaan);

router.route("/updateStatus/:id").patch(authMiddleware, controller.updategaudaanStatus);


module.exports = router;