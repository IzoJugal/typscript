import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import Logo from '../Model/Logo';
import getGFS from '../config/gridfs';
import isAdmin from '../middleware/adminMiddleware';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, and GIF are allowed.'));
    }
  },
});

const deleteOldLogo = async (fileId: any) => {
  try {
    const gfs = getGFS();
    await gfs.delete(fileId);
  } catch (err) {
    console.error('Error deleting old logo:', err);
  }
};

// Extend Request type to include user property if needed
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

router.post(
  '/upload',
  isAdmin,
  upload.single('logo'),
  async (req: Request, res: Response) => {
    console.time('upload');
    if (!req.file) {
      console.timeEnd('upload');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let gfs;
    try {
      gfs = getGFS();
    } catch {
      console.timeEnd('upload');
      return res.status(503).json({ error: 'Database not connected' });
    }

    try {
      const currentLogo = await Logo.findOne({});

      const filename = `logo_${Date.now()}${path.extname(req.file.originalname)}`;
      const uploadStream = gfs.openUploadStream(filename, {
        contentType: req.file.mimetype,
      });

      uploadStream.end(req.file.buffer);

      uploadStream.on('finish', async () => {
        try {
          await Logo.deleteMany({});
          await new Logo({
            title: filename,
            filename,
            fileId: uploadStream.id,
            uploadedBy: req.user?.userId,
          }).save();

          if (currentLogo && currentLogo.fileId) {
            deleteOldLogo(currentLogo.fileId);
          }

          console.timeEnd('upload');
          res.status(200).json({
            message: 'Logo uploaded successfully',
            logoUrl: `${process.env.VITE_BACK_URL}/logo`,
          });
        } catch (err) {
          console.error('Error saving metadata:', err);
          console.timeEnd('upload');
          res.status(500).json({ error: 'Failed to save logo metadata' });
        }
      });

      uploadStream.on('error', (err) => {
        console.error('Upload stream error:', err);
        console.timeEnd('upload');
        res.status(500).json({ error: 'Upload failed' });
      });
    } catch (err) {
      console.error('Error processing upload:', err);
      console.timeEnd('upload');
      res.status(500).json({ error: 'Failed to process upload' });
    }
  }
);

router.get('/', async (req: Request, res: Response) => {
  let gfs;
  try {
    gfs = getGFS();
  } catch {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
    const logo = await Logo.findOne({});
    if (!logo || !logo.fileId) {
      return res.status(404).json({ error: 'No logo found' });
    }

    const files = await gfs.find({ _id: logo.fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'No logo found' });
    }

    res.set('Content-Type', files[0].contentType || 'image/png');
    const readStream = gfs.openDownloadStream(files[0]._id);
    readStream.pipe(res);
  } catch (err) {
    console.error('Error fetching logo:', err);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
});

export default router;
