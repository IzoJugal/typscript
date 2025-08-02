const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const controller = require("../controller/AdminController");
const adminMiddleware = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");

let gfs;
const conn = mongoose.connection;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads", // Name of the GridFS bucket
  });
});


const storage = multer.memoryStorage(); // Use memory storage instead of disk
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



router.route("/admin").get(adminMiddleware, controller.getAdmin);

//Admin 
router.route("/profile").get(adminMiddleware, controller.getAdminProfile);

router.route("/profile").patch(adminMiddleware, uploadMultiple, controller.updateAdminProfile);

router.route("/profile/image/:filename").get( controller.getAdminProfileImage)

router.route("/password").patch(adminMiddleware, controller.changePassword);

//Donation
router.route("/totalpickups").get(adminMiddleware, controller.PickedUpAndDonated);

router.route("/totalscraped").get(adminMiddleware, controller.getTotalScrapedWeight);

router.route("/totaldonationValue").get(adminMiddleware, controller.getTotalDonationValue);

router.route("/activeUsers").get(adminMiddleware, controller.getUsersCounts);

router.route("/activeDealers").get(adminMiddleware, controller.getDealersCounts);

router.route("/activeVolunteers").get(adminMiddleware, controller.getVolunteerCounts);

router.route("/pendingDonation").get(adminMiddleware, controller.getPendingDonations);

router.route("/pickups/:id").get(adminMiddleware, controller.getDonationById);

router.route("/activedonations").get(adminMiddleware, controller.getActiveDonations)


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

router.route("/task/:taskId").delete(adminMiddleware, controller.deleteVolunteerTask);

router.route('/tasks').get(adminMiddleware, controller.getAllVolunteerTasks);

//Users Data
router.route("/users").get(adminMiddleware, controller.getUsers);

router.route('/users/:id').patch(adminMiddleware, uploadMultiple, controller.updateUserById);

router.route('/users/:id').get(adminMiddleware, controller.getUserById);

router.route('/users/:id').delete(adminMiddleware, controller.deleteUserById);

router.route('/users/:id/active').patch(adminMiddleware, controller.toggleUserStatus);

//Dealer Data crud
router.route("/getdealers").get(adminMiddleware, controller.fetchDealers);

router.route('/dealer/:id').get(adminMiddleware, controller.getDealerById);

router.route('/dealer/:id').patch(adminMiddleware, uploadMultiple, controller.updateDealerById);

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

//Shelter
router.post('/shelters', adminMiddleware, uploadMultiple, controller.createShelter);

router.patch("/shelter/:id", adminMiddleware, uploadMultiple, controller.updateShelter);

router.get('/shelters', adminMiddleware,  controller.getAllShelters);

router.patch('/shelter/:id/active', adminMiddleware, controller.shelterToggle)

router.delete('/shelter/:id', adminMiddleware, controller.deleteShelter);

//Gaudaan Data
router.route("/gaudaan").get(adminMiddleware, controller.getGaudaanSubmissions); 

router.route("/gaudaan/:id").get(adminMiddleware, controller.getGaudaanById); 

router.route("/uvolunteer").get(adminMiddleware, controller.getVolunteerUsers);

router.route("/assignVolunteer/:gaudaanId").patch(adminMiddleware, controller.assignVolunteer);

router.patch("/reject/:gaudaanId", adminMiddleware, controller.rejectGaudaan);

//Contacts
router.get("/contacts", adminMiddleware, controller.getContacts);
router.delete("/contact/:id", adminMiddleware, controller.deleteContact);


module.exports = router;