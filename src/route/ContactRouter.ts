import express, { Request, Response, NextFunction } from 'express';
import { submitContactForm } from '../controller/ContactController';

const router = express.Router();

router.post('/contact', (req: Request, res: Response, next: NextFunction) => {
  submitContactForm(req, res);
});

export default router;
