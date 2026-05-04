from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.config.settings import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASS,
    MAIL_FROM=settings.SMTP_FROM_EMAIL or settings.SMTP_USER,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fm = FastMail(conf)

async def send_reset_email(email: str, name: str, token: str, is_first_time: bool = False):
    extra = "&type=setup" if is_first_time else ""
    reset_url = f"{settings.frontend_url}/portal/reset-password?token={token}{extra}"
    
    subject = 'Welcome to Smart Parking - Set your password' if is_first_time else 'Reset your Smart Parking password'
    title = 'Welcome to Smart Parking!' if is_first_time else 'Password Reset Request'
    body = "You have been registered as a member. Please click the button below to set your password and access your portal." if is_first_time else "We received a request to reset your password. If you didn't make this request, you can safely ignore this email."
    button_text = 'Set Password' if is_first_time else 'Reset Password'

    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c; margin-bottom: 20px;">{title}</h2>
      <p style="color: #4a5568; line-height: 1.6;">Hello {name},</p>
      <p style="color: #4a5568; line-height: 1.6;">{body}</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="{reset_url}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          {button_text}
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 40px; border-top: 1px solid #edf2f7; padding-top: 20px;">
        If the button above doesn't work, copy and paste this link into your browser: <br/>
        <span style="word-break: break-all; color: #3182ce;">{reset_url}</span>
      </p>
    </div>
    """

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    await fm.send_message(message)

async def send_operator_reset_email(email: str, name: str, token: str):
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c; margin-bottom: 20px;">Operator Password Reset</h2>
      <p style="color: #4a5568; line-height: 1.6;">Hello {name},</p>
      <p style="color: #4a5568; line-height: 1.6;">A password reset link has been generated for your operator account.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="{reset_url}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Staff Password
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 40px;">
        This link will expire in 1 hour.
      </p>
    </div>
    """

    message = MessageSchema(
        subject='Staff Password Reset',
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    await fm.send_message(message)

async def send_staff_welcome_email(email: str, name: str, token: str):
    reset_url = f"{settings.frontend_url}/reset-password?token={token}&type=setup"
    
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c; margin-bottom: 20px;">Welcome to the Team!</h2>
      <p style="color: #4a5568; line-height: 1.6;">Hello {name},</p>
      <p style="color: #4a5568; line-height: 1.6;">You have been added as an operator for the Smart Parking System. Please click the button below to set your account password.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="{reset_url}" style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Set Up Account
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 40px;">
        If you have any questions, please contact your administrator.
      </p>
    </div>
    """

    message = MessageSchema(
        subject='Welcome to Smart Parking - Staff Account Setup',
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    await fm.send_message(message)
