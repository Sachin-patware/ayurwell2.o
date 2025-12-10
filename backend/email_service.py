import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import ssl

class EmailService:
    def __init__(self):
        # Environment variables
        self.from_email = os.getenv("FROM_EMAIL")
        self.from_name = os.getenv("FROM_NAME")

        # SMTP
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER",)
        self.smtp_password = os.getenv("SMTP_PASSWORD",)

    # =============================================
    # Master Send Function
    # =============================================
    def send_email(self, to_email, subject, html_body, text_body=None):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            if text_body:
                msg.attach(MIMEText(text_body, "plain"))

            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                code, features = server.ehlo()
                print("SMTP Features:", features)

                # Detect LOCAL MODE (MailHog / aiosmtpd)
                local_mode = (
                    self.smtp_host in ["localhost", "127.0.0.1"] and
                    self.smtp_port == 1025
                )

                # Try STARTTLS only if supported and NOT local
                if "starttls" in str(features).lower() and not local_mode:
                    print("→ Using STARTTLS")
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()

                # Try login only if username + password exist
                if self.smtp_user and self.smtp_password:
                    print("→ Using LOGIN")
                    server.login(self.smtp_user, self.smtp_password)

                # Send message
                server.send_message(msg)
                server.quit()

            print(f"📧 SMTP Email sent to {to_email}")
            return True

        except Exception as e:
            print("❌ SMTP Error:", str(e))
            return False
    
    # ==================== APPOINTMENT EMAIL TEMPLATES ====================
    
    def send_new_booking_request(self, doctor_email, doctor_name, patient_name, appointment_time):
        """Email to doctor when patient books appointment"""
        subject = f"New Appointment Request from {patient_name}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">New Appointment Request</h2>
                <p>Dear Dr. {doctor_name},</p>
                <p>You have received a new appointment request:</p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Patient:</strong> {patient_name}</p>
                    <p><strong>Date & Time:</strong> {appointment_time}</p>
                    <p><strong>Status:</strong> <span style="color: #f59e0b;">Pending Your Confirmation</span></p>
                </div>
                
                <p>Please log in to your dashboard to confirm or reject this appointment.</p>
                
                <a href="http://localhost:3000/practitioner/appointments" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    View Appointments
                </a>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(doctor_email, subject, html_body)
    
    def send_appointment_confirmed(self, patient_email, patient_name, doctor_name, appointment_time):
        """Email to patient when doctor confirms appointment"""
        subject = "Your Appointment is Confirmed"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">Appointment Confirmed ✓</h2>
                <p>Dear {patient_name},</p>
                <p>Great news! Your appointment has been confirmed.</p>
                
                <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p><strong>Doctor:</strong> Dr. {doctor_name}</p>
                    <p><strong>Date & Time:</strong> {appointment_time}</p>
                    <p><strong>Status:</strong> <span style="color: #10b981;">Confirmed</span></p>
                </div>
                
                <p>Please arrive 10 minutes before your scheduled time.</p>
                
                <a href="http://localhost:3000/patient/appointments" 
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    View My Appointments
                </a>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(patient_email, subject, html_body)
    
    def send_appointment_cancelled(self, to_email, to_name, cancelled_by, doctor_name, patient_name, 
                                   appointment_time, reason=None):
        """Email when appointment is cancelled"""
        subject = "Appointment Cancelled"
        
        reason_html = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ef4444;">Appointment Cancelled</h2>
                <p>Dear {to_name},</p>
                <p>An appointment has been cancelled by {cancelled_by}.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>Doctor:</strong> Dr. {doctor_name}</p>
                    <p><strong>Patient:</strong> {patient_name}</p>
                    <p><strong>Date & Time:</strong> {appointment_time}</p>
                    {reason_html}
                </div>
                
                <p>If you have any questions, please contact us.</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)
    
    def send_patient_reschedule_request(self, doctor_email, doctor_name, patient_name, 
                                       old_time, new_time):
        """Email to doctor when patient requests reschedule"""
        subject = f"Reschedule Request from {patient_name}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #f59e0b;">Reschedule Request</h2>
                <p>Dear Dr. {doctor_name},</p>
                <p>{patient_name} has requested to reschedule their appointment.</p>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p><strong>Patient:</strong> {patient_name}</p>
                    <p><strong>Original Time:</strong> <span style="text-decoration: line-through;">{old_time}</span></p>
                    <p><strong>Requested Time:</strong> <span style="color: #f59e0b; font-weight: bold;">{new_time}</span></p>
                </div>
                
                <p>Please review and confirm the new time.</p>
                
                <a href="http://localhost:3000/practitioner/appointments" 
                   style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Review Request
                </a>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(doctor_email, subject, html_body)
    
    def send_doctor_reschedule_proposal(self, patient_email, patient_name, doctor_name, 
                                       old_time, new_time, reason):
        """Email to patient when doctor proposes reschedule"""
        subject = f"Dr. {doctor_name} Proposed a New Appointment Time"
        
        reason_html = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #f59e0b;">Appointment Time Change Requested</h2>
                <p>Dear {patient_name},</p>
                <p>Dr. {doctor_name} has proposed a new time for your appointment.</p>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p><strong>Original Time:</strong> <span style="text-decoration: line-through;">{old_time}</span></p>
                    <p><strong>Proposed Time:</strong> <span style="color: #f59e0b; font-weight: bold;">{new_time}</span></p>
                    <p><strong>Reason:</strong> {reason}</p>
                </div
                
                <p><strong>Please accept or reject this change.</strong></p>
                
                <a href="http://localhost:3000/patient/appointments" 
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin: 10px 10px 10px 0;">
                    Accept
                </a>
                <a href="http://localhost:3000/patient/appointments" 
                   style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin: 10px 0;">
                    Reject
                </a>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(patient_email, subject, html_body)
    
    def send_reschedule_accepted(self, doctor_email, doctor_name, patient_name, new_time):
        """Email to doctor when patient accepts reschedule"""
        subject = f"{patient_name} Accepted Reschedule"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">Reschedule Accepted ✓</h2>
                <p>Dear Dr. {doctor_name},</p>
                <p>{patient_name} has accepted the new appointment time.</p>
                
                <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p><strong>Patient:</strong> {patient_name}</p>
                    <p><strong>Confirmed Time:</strong> {new_time}</p>
                    <p><strong>Status:</strong> <span style="color: #10b981;">Confirmed</span></p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(doctor_email, subject, html_body)
    
    def send_reschedule_rejected_to_doctor(self, doctor_email, doctor_name, patient_name, start_time, proposed_time):
        """Email to doctor when patient rejects reschedule"""
        subject = f"{patient_name} Rejected Reschedule"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ef4444;">Reschedule Rejected</h2>
                <p>Dear Dr. {doctor_name},</p>
                <p>{patient_name} has rejected the proposed appointment time.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>Patient:</strong> {patient_name}</p>
                    <p><strong>Rejected Time:</strong><span style="text-decoration: line-through;"> {proposed_time}</span></p>
                    <p><strong>Original Time:</strong> {start_time}</p>
                    <p><strong>Status:</strong> <span style="color: #ef4444;">Reschedule Rejected</span></p>
                </div>
                
                <p>The reschedule request has been rejected. You may contact the patient to schedule a new time.</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(doctor_email, subject, html_body)

    def send_reschedule_rejected_to_patient(self, doctor_email, doctor_name, patient_name, start_time, proposed_time):
        """Email to doctor when patient rejects reschedule"""
        subject = f"{patient_name} Rejected Reschedule"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ef4444;">Reschedule Rejected</h2>
                <p>Dear {patient_name},</p>
                <p> Dr.{doctor_name} has rejected the proposed appointment time.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>Doctor:</strong> {doctor_name}</p>
                    <p><strong>Rejected Time:</strong><span style="text-decoration: line-through;"> {proposed_time}</span></p>
                    <p><strong>Original Time:</strong> {start_time}</p>
                    <p><strong>Status:</strong> <span style="color: #ef4444;">Reschedule Rejected</span></p>
                </div>
                
                <p>The reschedule request has been rejected. You may contact the doctor to schedule a new time.</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This is an automated message from AyurWell.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(doctor_email, subject, html_body)


# Global email service instance
email_service = EmailService()


# Helper function to format datetime for emails
def format_appointment_time(dt):
    """Format datetime for email display"""
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except:
            return dt
    
    return dt.strftime("%A, %B %d, %Y at %I:%M %p")
