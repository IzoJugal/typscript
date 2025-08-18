import { FileFilterCallback } from "multer";

import mongoose from "mongoose";
import express from "express";
import controller from "../controller/AdminController";
import adminMiddleware from "../middleware/adminMiddleware";
import multer from "multer";
import path from "path";

const router = express.Router();

let gfs;
const conn = mongoose.connection;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
    bucketName: "uploads", // Name of the GridFS bucket
  });
});


const storage = multer.memoryStorage(); // Use memory storage instead of disk
const upload = multer({
  storage,
  fileFilter: (req,file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
// Accept 1 profileImage + multiple images fields:
const uploadMultiple = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "images", maxCount: 10 }, // max 10 images (adjust as needed)
]);



router.route("/admin").get(adminMiddleware, controller.getAdmin as any);

//Admin 
router.route("/profile").get(adminMiddleware, controller.getAdminProfile as any);

router.route("/profile").patch(adminMiddleware, uploadMultiple, controller.updateAdminProfile as any);

router.route("/profile/image/:filename").get(controller.getAdminProfileImage)

router.route("/password").patch(adminMiddleware, controller.changePassword as any);

//Donation
router.route("/totalpickups").get(adminMiddleware, controller.PickedUpAndDonated as any);

router.route("/totalscraped").get(adminMiddleware, controller.getTotalScrapedWeight as any);

router.route("/totaldonationValue").get(adminMiddleware, controller.getTotalDonationValue as any);

router.route("/activeUsers").get(adminMiddleware, controller.getUsersCounts as any);

router.route("/activeDealers").get(adminMiddleware, controller.getDealersCounts as any);

router.route("/activeVolunteers").get(adminMiddleware, controller.getVolunteerCounts as any);

router.route("/pendingDonation").get(adminMiddleware, controller.getPendingDonations as any);

router.route("/pickups/:id").get(adminMiddleware, controller.getDonationById as any);

router.route("/activedonations").get(adminMiddleware, controller.getActiveDonations)


//History Data
router.route("/history").get(adminMiddleware, controller.getHistory as any);

//Dealer Data
router.route("/dealers").get(adminMiddleware, controller.getDealers as any);

router.route("/assigndealer/:id").patch(adminMiddleware, controller.assignDealer as any);

router.route("/donations/:id/reject").patch(adminMiddleware, controller.rejectDonation as any);

//Task Data
router.route("/volunteers").get(adminMiddleware, controller.getVolunteers as any);

router.route('/task').post(adminMiddleware, controller.createVolunteerTask as any);

router.route("/task/:taskId").patch(adminMiddleware, controller.updateVolunteerTask as any);

router.route("/task/:taskId").delete(adminMiddleware, controller.deleteVolunteerTask as any);

router.route('/tasks').get(adminMiddleware, controller.getAllVolunteerTasks as any);

router.route("/task/:id").get(adminMiddleware, controller.getSingleTask as any);

//Users Data
router.route("/users").get(adminMiddleware, controller.getUsers as any);

router.route('/users/:id').patch(adminMiddleware, uploadMultiple, controller.updateUserById as any);

router.route('/users/:id').get(adminMiddleware, controller.getUserById as any);

router.route('/users/:id').delete(adminMiddleware, controller.deleteUserById as any);

router.route('/users/:id/active').patch(adminMiddleware, controller.toggleUserStatus as any);

//Dealer Data crud
router.route("/getdealers").get(adminMiddleware, controller.fetchDealers as any);

router.route('/dealer/:id').get(adminMiddleware, controller.getDealerById as any);

router.route('/dealer/:id').patch(adminMiddleware, uploadMultiple, controller.updateDealerById as any);

router.route('/dealer/:id').delete(adminMiddleware, controller.deleteDealerById as any);

router.route('/dealer/:id/active').patch(adminMiddleware, controller.toggleDealerStatus as any);

//Delete Account
router.route("/delete/:id").delete(adminMiddleware, controller.deleteAccount as any);

//Logo & Sliders Img
router.post('/upload-slider', upload.array("images", 10), controller.sliderImage as any);

router.get('/sliders', controller.getSliders as any);

router.post("/upload-logo", upload.single("logo"), controller.uploadLogo as any);

router.get("/logos", controller.logoGet as any);

//Impacts Data
router.route("/impacts").get(adminMiddleware, controller.getImpacts as any);

router.route("/impacts").post(adminMiddleware, controller.saveImpacts as any);

//Shelter
router.post('/shelters', adminMiddleware, uploadMultiple, controller.createShelter as any);

router.patch("/shelter/:id", adminMiddleware, uploadMultiple, controller.updateShelter as any);

router.get('/shelters', adminMiddleware, controller.getAllShelters as any);

router.patch('/shelter/:id/active', adminMiddleware, controller.shelterToggle)

router.delete('/shelter/:id', adminMiddleware, controller.deleteShelter as any);

//Gaudaan Data
router.route("/gaudaan").get(adminMiddleware, controller.getGaudaanSubmissions as any);

router.route("/gaudaan/:id").get(adminMiddleware, controller.getGaudaanById as any);

router.route("/uvolunteer").get(adminMiddleware, controller.getVolunteerUsers as any);

router.route("/assignVolunteer/:gaudaanId").patch(adminMiddleware, controller.assignVolunteer as any);

router.patch("/reject/:gaudaanId", adminMiddleware, controller.rejectGaudaan as any);

router.route("/gaudaans").get(adminMiddleware, controller.getGaudaanCR as any);


//Contacts
router.get("/contacts", adminMiddleware, controller.getContacts as any);
router.delete("/contact/:id", adminMiddleware, controller.deleteContact as any);


export default router;