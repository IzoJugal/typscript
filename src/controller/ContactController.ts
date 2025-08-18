import { Request, Response } from 'express';
import Contact from '../Model/ContactModel'; 

export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error: any) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
