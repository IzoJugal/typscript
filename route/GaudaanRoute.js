import express from "express"
const router = express.Router();
import controller from "../controller/GaudaanController.js"
import multer from "multer"
import path from "path"

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

router.route("/gaudaan").post(upload.array("images", 5), controller.gaudaanForm);

router.route("/gaudaan").get( controller.getGaudaanSubmissions); 

router.route("/uvolunteer").get( controller.getUsersByRole);

router.route("/assignVolunteer/:gaudaanId").patch( controller.assignVolunteer); 

router.route("/assigned/:volunteerId").get( controller.getAssignedGaudaan);

router.route("/updateStatus/:id").patch( controller.updategaudaanStatus);


export default router;