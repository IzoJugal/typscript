const express = require("express");
const router = express.Router();
const controller = require("../controller/GaudaanController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");


router.route("/assigned/:volunteerId").get(authMiddleware, controller.getAssignedGaudaan);

router.route("/updateStatus/:id").patch(authMiddleware, controller.updategaudaanStatus);

router.route("/gaudaan").get(adminMiddleware, controller.getGaudaanSubmissions); 

router.route("/uvolunteer").get(adminMiddleware, controller.getUsersByRole);

router.route("/assignVolunteer/:gaudaanId").patch(adminMiddleware, controller.assignVolunteer); 



module.exports = router;