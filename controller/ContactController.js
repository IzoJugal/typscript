import Contact from "../Model/ContactModel.js"

// Controller function
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res
        .status(400)
        .json({  message: "All fields are required." });
    }

      const contact = new Contact({ name, email, phone, message });
    await contact.save();

    res
      .status(200)
      .json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export default submitContactForm;