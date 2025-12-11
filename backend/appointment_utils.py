"""
Utility functions for appointment management
"""
from models import Appointment, User, get_ist_now
from email_service import email_service, format_appointment_time
import traceback

def get_user_email(user_id):
    """Get user email from User collection"""
    user = User.objects(uid=user_id).first()
    return user.email if user else None

def auto_complete_appointments():
    """
    Automatically complete confirmed appointments that have passed their end time.
    This should be called at the start of any GET endpoint that returns appointments.
    
    Returns:
        int: Number of appointments auto-completed
    """
    now = get_ist_now()
    
    # Find all confirmed appointments where end time has passed
    past_appointments = Appointment.objects(
        status='confirmed',
        endTimestamp__lt=now
    )
    
    count = 0
    # Process each appointment to send email and update status
    for appt in past_appointments:
        try:
            # Update status
            appt.status = 'completed'
            appt.updatedAt = now
            appt.save()
            count += 1
            
            # Send completion email
            patient_email = get_user_email(appt.patientId)
            if patient_email:
                print(f"📧 Sending completion email to {patient_email}")
                email_service.send_appointment_completed(
                    patient_email,
                    appt.patientName,
                    appt.doctorName,
                    format_appointment_time(appt.startTimestamp)
                )
        except Exception as e:
            print(f" Error auto-completing appointment {appt.id}: {e}")
            traceback.print_exc()
            
    return count
