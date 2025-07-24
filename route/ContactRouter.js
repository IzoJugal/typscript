import express from "express"
const router = express.Router();
import  submitContactForm  from "../controller/ContactController.js"

router.post("/contact", submitContactForm);

export default router;
