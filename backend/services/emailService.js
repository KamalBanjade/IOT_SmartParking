import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send password reset email
 */
export async function sendResetEmail(email, name, token, isFirstTime = false) {
  const resetUrl = `${process.env.FRONTEND_URL}/portal/reset-password?token=${token}${isFirstTime ? '&type=setup' : ''}`;
  
  const subject = isFirstTime ? 'Welcome to Smart Parking - Set your password' : 'Reset your Smart Parking password';
  const title = isFirstTime ? 'Welcome to Smart Parking!' : 'Password Reset Request';
  const body = isFirstTime 
    ? `You have been registered as a member. Please click the button below to set your password and access your portal.`
    : `We received a request to reset your password. If you didn't make this request, you can safely ignore this email.`;
  const buttonText = isFirstTime ? 'Set Password' : 'Reset Password';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c; margin-bottom: 20px;">${title}</h2>
      <p style="color: #4a5568; line-height: 1.6;">Hello ${name},</p>
      <p style="color: #4a5568; line-height: 1.6;">${body}</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ${buttonText}
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 40px; border-top: 1px solid #edf2f7; padding-top: 20px;">
        If the button above doesn't work, copy and paste this link into your browser: <br/>
        <span style="word-break: break-all; color: #3182ce;">${resetUrl}</span>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: subject,
    html: html,
  });
}

/**
 * Send reset email for operators (staff)
 */
export async function sendOperatorResetEmail(email, name, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c; margin-bottom: 20px;">Operator Password Reset</h2>
      <p style="color: #4a5568; line-height: 1.6;">Hello ${name},</p>
      <p style="color: #4a5568; line-height: 1.6;">A password reset link has been generated for your operator account.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Staff Password
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 40px;">
        This link will expire in 1 hour.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Staff Password Reset',
    html: html,
  });
}

/**
 * Send welcome email for new staff
 */
export async function sendStaffWelcomeEmail(email, name, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&type=setup`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c; margin-bottom: 20px;">Welcome to the Team!</h2>
      <p style="color: #4a5568; line-height: 1.6;">Hello ${name},</p>
      <p style="color: #4a5568; line-height: 1.6;">You have been added as an operator for the Smart Parking System. Please click the button below to set your account password.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Set Up Account
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 40px;">
        If you have any questions, please contact your administrator.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Welcome to Smart Parking - Staff Account Setup',
    html: html,
  });
}
