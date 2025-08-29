import nodemailer from 'nodemailer';

interface Attachment {
  filename: string;
  path: string;
}

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  attachments: Attachment[] = []
): Promise<any> => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"EcoCycle Foundation" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      attachments,
    };


    const info = await transporter.sendMail(mailOptions);

    // ✅ Return the info object so the caller can log it
    return info;

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export { sendEmail };
