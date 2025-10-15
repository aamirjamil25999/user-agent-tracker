import nodemailer from 'nodemailer';
const useService = process.env.EMAIL_SERVICE;
const transporter = useService ? nodemailer.createTransport({
  service: useService,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
}) : nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } : undefined
});
export async function sendOTP(email, code) {
  const mailOptions = { from: process.env.EMAIL_FROM || 'no-reply@example.com', to: email, subject: 'Your OTP Code', text: `Your OTP code is: ${code}` };
  try {
    if (!process.env.EMAIL_USER) { console.log('[OTP SIM]', email, code); return { success:true }; }
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent id:', info && info.messageId);
    return { success:true, info };
  } catch (err) { console.error('sendOTP error', err); return { success:false, error:String(err)} }
}
