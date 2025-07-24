const express = require("express");
const router = express.Router();
const controller = require("../controller/AdminController");
const adminMiddleware = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });


router.route("/admin").get(adminMiddleware, controller.getAdmin);

//Admin 
router.route("/profile").get(adminMiddleware, controller.getAdminProfile);

router.route("/profile").patch(adminMiddleware, controller.updateAdminProfile);

router.route("/password").patch(adminMiddleware, controller.changePassword);

//Donation
router.route("/totalpickups").get(adminMiddleware, controller.PickedUpAndDonated);

router.route("/totalscraped").get(adminMiddleware, controller.getTotalScrapedWeight);

router.route("/totaldonationValue").get(adminMiddleware, controller.getTotalDonationValue);

router.route("/activeUsers").get(adminMiddleware, controller.getUsersCounts);

router.route("/activeDealers").get(adminMiddleware, controller.getDealersCounts);

router.route("/activeVolunteers").get(adminMiddleware, controller.getVolunteerCounts);

router.route("/pendingDonation").get(adminMiddleware, controller.getPendingDonations);

//History Data
router.route("/history").get(adminMiddleware, controller.getHistory);

//Dealer Data
router.route("/dealers").get(adminMiddleware, controller.getDealers);

router.route("/assigndealer/:id").patch(adminMiddleware, controller.assignDealer);

router.route("/donations/:id/reject").patch(adminMiddleware, controller.rejectDonation);

//Task Data
router.route("/volunteers").get(adminMiddleware, controller.getVolunteers);

router.route('/task').post(adminMiddleware, controller.createVolunteerTask);

router.route("/task/:taskId").patch(adminMiddleware, controller.updateVolunteerTask);

router.route('/tasks').get(adminMiddleware, controller.getAllVolunteerTasks);

//Users Data
router.route("/users").get(adminMiddleware, controller.getUsers);

router.route('/users/:id').patch(adminMiddleware, controller.updateUserById);

router.route('/users/:id').get(adminMiddleware, controller.getUserById);

router.route('/users/:id').delete(adminMiddleware, controller.deleteUserById);

router.route('/users/:id/active').patch(adminMiddleware, controller.toggleUserStatus);

//Dealer Data crud
router.route("/getdealers").get(adminMiddleware, controller.fetchDealers);

router.route('/dealer/:id').get(adminMiddleware, controller.getDealerById);

router.route('/dealer/:id').patch(adminMiddleware, controller.updateDealerById);

router.route('/dealer/:id').delete(adminMiddleware, controller.deleteDealerById);

router.route('/dealer/:id/active').patch(adminMiddleware, controller.toggleDealerStatus);

//Delete Account
router.route("/delete/:id").delete(adminMiddleware,controller.deleteAccount);

//Logo & Sliders Img
router.post('/upload-slider', upload.array("images", 10), controller.sliderImage);

router.get('/sliders', controller.getSliders); 

router.post("/upload-logo", upload.single("logo"), controller.uploadLogo);

router.get("/logos", controller.logoGet);

//Impacts Data
router.route("/impacts").get(adminMiddleware, controller.getImpacts);

router.route("/impacts").post(adminMiddleware, controller.saveImpacts); 

//Gaudaan Data
router.route("/gaudaan").get(adminMiddleware, controller.getGaudaanSubmissions); 

router.route("/uvolunteer").get(adminMiddleware, controller.getVolunteerUsers);

router.route("/assignVolunteer/:gaudaanId").patch(adminMiddleware, controller.assignVolunteer);

module.exports = router;