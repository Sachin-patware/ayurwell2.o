"""
Utility functions for appointment management
"""
from models import Appointment, get_ist_now

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
    
    # Update them to completed
    count = past_appointments.update(
        set__status='completed',
        set__updatedAt=now
    )
    
    return count
