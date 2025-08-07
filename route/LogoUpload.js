const express = require("express");
const router = express.Router();
const isAdmin = require("../middleware/adminMiddleware");
const Logo = require("../Model/Logo");
const getGFS = require("../config/gridfs");
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PNG, JPEG, and GIF are allowed."));
    }
  },
});

const deleteOldLogo = async (fileId) => {
  try {
    const gfs = getGFS();
    await gfs.delete(fileId);
  } catch (err) {
    console.error("Error deleting old logo:", err);
  }
};

router.post("/upload", isAdmin, upload.single("logo"), async (req, res) => {
  console.time("upload"); // Log upload time
  if (!req.file) {
    console.timeEnd("upload");
    return res.status(400).json({ error: "No file uploaded" });
  }

  let gfs;
  try {
    gfs = getGFS();
  } catch {
    console.timeEnd("upload");
    return res.status(503).json({ error: "Database not connected" });
  }

  try {
    // Find current logo
    const currentLogo = await Logo.findOne({});

    // Upload new file to GridFS
    const filename = `logo_${Date.now()}${path.extname(req.file.originalname)}`;
    const uploadStream = gfs.openUploadStream(filename, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      try {
        // Save new logo metadata
        await Logo.deleteMany({});
        await new Logo({
          title: filename,
          filename,
          fileId: uploadStream.id,
          uploadedBy: req.user.userId,
        }).save();

        // Delete old logo in the background
        if (currentLogo && currentLogo.fileId) {
          deleteOldLogo(currentLogo.fileId);
        }

        console.timeEnd("upload");
        res.status(200).json({
          message: "Logo uploaded successfully",
          logoUrl: `${import.meta.env.VIE_BACK_URL}/logo`, 
        });
      } catch (err) {
        console.error("Error saving metadata:", err);
        console.timeEnd("upload");
        res.status(500).json({ error: "Failed to save logo metadata" });
      }
    });

    uploadStream.on("error", (err) => {
      console.error("Upload stream error:", err);
      console.timeEnd("upload");
      res.status(500).json({ error: "Upload failed" });
    });
  } catch (err) {
    console.error("Error processing upload:", err);
    console.timeEnd("upload");
    res.status(500).json({ error: "Failed to process upload" });
  }
});

router.get("/", async (req, res) => {
  let gfs;
  try {
    gfs = getGFS();
  } catch {
    return res.status(503).json({ error: "Database not connected" });
  }

  try {
    const logo = await Logo.findOne({});
    if (!logo || !logo.fileId) {
      return res.status(404).json({ error: "No logo found" });
    }

    const file = await gfs.find({ _id: logo.fileId }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ error: "No logo found" });
    }

    res.set("Content-Type", file[0].contentType || "image/png");
    const readStream = gfs.openDownloadStream(file[0]._id);
    readStream.pipe(res);
  } catch (err) {
    console.error("Error fetching logo:", err);
    res.status(500).json({ error: "Failed to fetch logo" });
  }
});

module.exports = router;