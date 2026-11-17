import nodemailer from "nodemailer";

export async function sendLoginOtpEmail(email: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !user || !password || !Number.isInteger(port)) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD are required.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to: email,
    subject: "Your sign-in code",
    text: `Your sign-in code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your sign-in code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
  });
}
