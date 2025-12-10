from flask import Blueprint, request, jsonify
from models import Appointment, User, Patient, Doctor, Assessment, get_ist_now
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from email_service import email_service, format_appointment_time
from appointment_utils import auto_complete_appointments

appt_bp = Blueprint('appointments', __name__)

# ==================== HELPER FUNCTIONS ====================

def check_appointment_conflict(doctor_id, start_time, exclude_appointment_id=None):
    """
    Check if there's a conflicting appointment
    
    Args:
        doctor_id: Doctor's ID
        start_time: Proposed start time
        exclude_appointment_id: Appointment ID to exclude (for rescheduling)
    
    Returns:
        bool: True if conflict exists, False otherwise
    """
    query = {
        'doctorId': doctor_id,
        'startTimestamp': start_time,
        'status__in': ['pending', 'confirmed', 'doctor_rescheduled_pending', 'patient_rescheduled_pending']
    }
    
    appointments = Appointment.objects(**query)
    
    if exclude_appointment_id:
        appointments = appointments.filter(id__ne=exclude_appointment_id)
    
    return appointments.count() > 0


def validate_status_transition(current_status, new_status):
    """
    Validate if status transition is allowed
    
    Returns:
        tuple: (is_valid, error_message)
    """
    ALLOWED_TRANSITIONS = {
        'pending': ['confirmed', 'cancelled', 'pending'],
        'confirmed': ['cancelled', 'doctor_rescheduled_pending', 'patient_rescheduled_pending', 'pending', 'completed'],
        'doctor_rescheduled_pending': ['confirmed', 'cancelled'],
        'patient_rescheduled_pending': ['confirmed', 'cancelled'],
        'cancelled': [],  # Terminal state
        'completed': []   # Terminal state
    }
    
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    
    if new_status not in allowed:
        return False, f"Cannot transition from {current_status} to {new_status}"
    
    return True, None


def get_user_email(user_id):
    """Get user email from User collection"""
    user = User.objects(uid=user_id).first()
    return user.email if user else None


# ==================== APPOINTMENT ENDPOINTS ====================

@appt_bp.route('/book', methods=['POST'])
@jwt_required()
def book_appointment():
    """
    Create a new appointment (patient books with doctor)
    Status starts as 'pending'
    """
    user_id = get_jwt_identity()
    data = request.json
    
    doctor_id = data.get('doctor_id')
    start_time_str = data.get('startTimestamp')
    notes = data.get('notes', '')
    
    if not doctor_id or not start_time_str:
        return jsonify({"error": "Missing required fields: doctor_id, startTimestamp"}), 400
    
    # Get patient and doctor info
    patient = Patient.objects(patientId=user_id).first()
    doctor = Doctor.objects(doctorId=doctor_id).first()
    
    if not patient or not doctor:
        return jsonify({"error": "Patient or Doctor not found"}), 404
    
    # Parse datetime
    try:
        start_dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"error": "Invalid date format. Use ISO format."}), 400
    
    # Check for conflicts
    if check_appointment_conflict(doctor_id, start_dt):
        return jsonify({
            "error": "This time slot is already booked",
            "conflict": True
        }), 409
    
    # Calculate end time (default 30 minutes)
    end_dt = start_dt + timedelta(minutes=30)
    
    # Create appointment
    appt = Appointment(
        patientId=user_id,
        doctorId=doctor_id,
        patientName=patient.name,
        doctorName=doctor.name,
        startTimestamp=start_dt,
        endTimestamp=end_dt,
        status='pending',
        notes=notes,
        createdAt=get_ist_now(),
        updatedAt=get_ist_now()
    )
    appt.save()
    
    # Send email to doctor
    doctor_email = get_user_email(doctor_id)
    if doctor_email:
        email_service.send_new_booking_request(
            doctor_email,
            doctor.name,
            patient.name,
            format_appointment_time(start_dt)
        )
    
    return jsonify({
        "message": "Appointment request sent. Waiting for doctor confirmation.",
        "id": str(appt.id),
        "status": "pending"
    }), 201


@appt_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_appointments():
    """Get appointments for current user (patient or doctor)"""
    # Auto-complete past confirmed appointments
    auto_complete_appointments()

    user_id = get_jwt_identity()
    user = User.objects(uid=user_id).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Determine if user is doctor or patient
    if user.role == 'doctor':
        appointments = Appointment.objects(doctorId=user_id).order_by('-startTimestamp')
    else:
        appointments = Appointment.objects(patientId=user_id).order_by('-startTimestamp')
    
    return jsonify([{
        "id": str(a.id),
        "doctorId": a.doctorId,
        "patientId": a.patientId,
        "doctorName": a.doctorName,
        "patientName": a.patientName,
        "startTimestamp": a.startTimestamp.isoformat(),
        "endTimestamp": a.endTimestamp.isoformat() if a.endTimestamp else None,
        "status": a.status,
        "notes": a.notes,
        "cancelReason": a.cancelReason,
        "rescheduleReason": getattr(a, 'rescheduleReason', None),
        "isRescheduledBy": a.isRescheduledBy,
        "proposedStartTimestamp": a.proposedStartTimestamp.isoformat() if a.proposedStartTimestamp else None,
        "proposedEndTimestamp": a.proposedEndTimestamp.isoformat() if a.proposedEndTimestamp else None,
        "createdAt": a.createdAt.isoformat(),
        "updatedAt": a.updatedAt.isoformat()
    } for a in appointments]), 200


@appt_bp.route('/doctor/<doctor_id>/upcoming', methods=['GET'])
@jwt_required()
def get_doctor_upcoming_appointments(doctor_id):
    """
    Get all upcoming appointments for a doctor (for slot availability checking)
    Returns pending and confirmed appointments
    """
    appointments = Appointment.objects(
        doctorId=doctor_id,
        status__in=['pending', 'confirmed']
    ).order_by('startTimestamp')
    
    return jsonify([{
        "id": str(a.id),
        "startTimestamp": a.startTimestamp.isoformat(),
        "endTimestamp": a.endTimestamp.isoformat() if a.endTimestamp else None,
        "status": a.status
    } for a in appointments]), 200


@appt_bp.route('/<appointment_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_appointment(appointment_id):
    """
    Doctor confirms a pending appointment
    Status: pending → confirmed
    """
    user_id = get_jwt_identity()
    
    appt = Appointment.objects(id=appointment_id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Verify doctor owns this appointment
    if appt.doctorId != user_id:
        return jsonify({"error": "Unauthorized. Only the assigned doctor can confirm."}), 403
    
    # Validate status transition
    is_valid, error = validate_status_transition(appt.status, 'confirmed')
    if not is_valid:
        return jsonify({"error": error}), 400
    
    # Update status
    # If confirming a reschedule, apply the proposed time
    if appt.status == 'patient_rescheduled_pending':
        if appt.proposedStartTimestamp:
            appt.startTimestamp = appt.proposedStartTimestamp
            appt.endTimestamp = appt.proposedEndTimestamp
            appt.proposedStartTimestamp = None
            appt.proposedEndTimestamp = None
    
    appt.status = 'confirmed'
    appt.updatedAt = get_ist_now()
    appt.save()
    
    # Send confirmation email to patient
    patient_email = get_user_email(appt.patientId)
    if patient_email:
        email_service.send_appointment_confirmed(
            patient_email,
            appt.patientName,
            appt.doctorName,
            format_appointment_time(appt.startTimestamp)
        )
    
    return jsonify({
        "message": "Appointment confirmed successfully",
        "status": "confirmed"
    }), 200


@appt_bp.route('/<appointment_id>/complete', methods=['POST'])
@jwt_required()
def complete_appointment(appointment_id):
    """
    DISABLED: Appointments are now auto-completed when end time passes.
    Doctors cannot manually complete appointments.
    """
    return jsonify({
        "error": "Manual completion disabled. Appointments auto-complete after end time."
    }), 403


@appt_bp.route('/<appointment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_appointment(appointment_id):
    """
    Cancel an appointment (by doctor or patient)
    Status: any → cancelled
    """
    user_id = get_jwt_identity()
    data = request.json
    reason = data.get('reason', '')
    
    appt = Appointment.objects(id=appointment_id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Verify user is participant
    if appt.doctorId != user_id and appt.patientId != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Check if already cancelled
    if appt.status == 'cancelled':
        return jsonify({"error": "Appointment is already cancelled"}), 400
    
    # Determine who cancelled
    cancelled_by = "Doctor" if appt.doctorId == user_id else "Patient"
    
    # Update status
    appt.status = 'cancelled'
    appt.cancelReason = reason if reason else f"Cancelled by {cancelled_by}"
    appt.updatedAt = get_ist_now()
    appt.save()
    
    # Send email to the other party
    if appt.doctorId == user_id:
        # Doctor cancelled, notify patient
        patient_email = get_user_email(appt.patientId)
        if patient_email:
            email_service.send_appointment_cancelled(
                patient_email,
                appt.patientName,
                "the doctor",
                appt.doctorName,
                appt.patientName,
                format_appointment_time(appt.startTimestamp),
                reason
            )
    else:
        # Patient cancelled, notify doctor
        doctor_email = get_user_email(appt.doctorId)
        if doctor_email:
            email_service.send_appointment_cancelled(
                doctor_email,
                appt.doctorName,
                "the patient",
                appt.doctorName,
                appt.patientName,
                format_appointment_time(appt.startTimestamp),
                reason
            )
    
    return jsonify({
        "message": "Appointment cancelled successfully",
        "status": "cancelled"
    }), 200


@appt_bp.route('/<appointment_id>/reschedule/patient', methods=['POST'])
@jwt_required()
def patient_reschedule(appointment_id):
    """
    Patient requests to reschedule appointment
    Status: confirmed → patient_rescheduled_pending
    CRITICAL: Only allow if status is 'confirmed' (not 'pending')
    """
    user_id = get_jwt_identity()
    data = request.json
    new_start_time_str = data.get('newStartTimestamp')
    
    if not new_start_time_str:
        return jsonify({"error": "Missing newStartTimestamp"}), 400
    
    appt = Appointment.objects(id=appointment_id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Verify patient owns this appointment
    if appt.patientId != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    # CRITICAL: Only allow reschedule if status is 'confirmed'
    if appt.status != 'confirmed':
        return jsonify({
            "error": f"Cannot reschedule appointment with status '{appt.status}'. Only confirmed appointments can be rescheduled."
        }), 400
    
    # Parse new datetime
    try:
        new_start_dt = datetime.fromisoformat(new_start_time_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400
    
    # Check for conflicts (exclude current appointment)
    if check_appointment_conflict(appt.doctorId, new_start_dt, exclude_appointment_id=appointment_id):
        return jsonify({
            "error": "The new time slot is already booked",
            "conflict": True
        }), 409
    
    # Calculate new end time
    new_end_dt = new_start_dt + timedelta(minutes=30)
    
    # Store proposed time and change status
    appt.proposedStartTimestamp = new_start_dt
    appt.proposedEndTimestamp = new_end_dt
    appt.status = 'patient_rescheduled_pending'
    appt.isRescheduledBy = 'patient'
    appt.updatedAt = get_ist_now()
    appt.save()
    
    # Send email to doctor
    doctor_email = get_user_email(appt.doctorId)
    if doctor_email:
        email_service.send_patient_reschedule_request(
            doctor_email,
            appt.doctorName,
            appt.patientName,
            format_appointment_time(appt.startTimestamp),
            format_appointment_time(new_start_dt)
        )
    
    return jsonify({
        "message": "Reschedule request sent to doctor",
        "appointment": {
            "id": str(appt.id),
            "doctorId": appt.doctorId,
            "patientId": appt.patientId,
            "patientName": appt.patientName,
            "doctorName": appt.doctorName,
            "startTimestamp": appt.startTimestamp.isoformat(),
            "endTimestamp": appt.endTimestamp.isoformat() if appt.endTimestamp else None,
            "proposedStartTimestamp": appt.proposedStartTimestamp.isoformat() if appt.proposedStartTimestamp else None,
            "proposedEndTimestamp": appt.proposedEndTimestamp.isoformat() if appt.proposedEndTimestamp else None,
            "status": appt.status,
            "isRescheduledBy": appt.isRescheduledBy,
            "notes": appt.notes,
            "rescheduleReason": getattr(appt, 'rescheduleReason', None),
            "updatedAt": appt.updatedAt.isoformat(),
        }
    }), 200


@appt_bp.route('/<appointment_id>/reschedule/doctor', methods=['POST'])
@jwt_required()
def doctor_reschedule(appointment_id):
    """
    Doctor proposes to reschedule appointment
    Status: pending/confirmed → doctor_rescheduled_pending
    """
    user_id = get_jwt_identity()
    data = request.json
    new_start_time_str = data.get('newStartTimestamp')
    reason = data.get('reason', '')  # Get reschedule reason
    
    if not new_start_time_str:
        return jsonify({"error": "Missing newStartTimestamp"}), 400
    
    appt = Appointment.objects(id=appointment_id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Verify doctor owns this appointment
    if appt.doctorId != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Allow doctor to propose reschedule for pending or confirmed appointments
    if appt.status not in ['pending', 'confirmed']:
        return jsonify({
            "error": f"Cannot propose reschedule for appointment with status '{appt.status}'"
        }), 400
    
    # Parse new datetime
    try:
        new_start_dt = datetime.fromisoformat(new_start_time_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400
    
    # Check for conflicts
    if check_appointment_conflict(appt.doctorId, new_start_dt, exclude_appointment_id=appointment_id):
        return jsonify({
            "error": "The new time slot is already booked",
            "conflict": True
        }), 409
    
    # Calculate new end time
    new_end_dt = new_start_dt + timedelta(minutes=30)
    
    # Store proposed time, reason, and change status
    appt.proposedStartTimestamp = new_start_dt
    appt.proposedEndTimestamp = new_end_dt
    appt.rescheduleReason = reason  # Save the reason
    appt.status = 'doctor_rescheduled_pending'
    appt.isRescheduledBy = 'doctor'
    appt.updatedAt = get_ist_now()
    appt.save()
    
    # Send email to patient
    patient_email = get_user_email(appt.patientId)
    if patient_email:
        email_service.send_doctor_reschedule_proposal(
            patient_email,
            appt.patientName,
            appt.doctorName,
            format_appointment_time(appt.startTimestamp),
            format_appointment_time(new_start_dt),
            appt.rescheduleReason,

        )
    return jsonify({
        "message": "Reschedule proposal sent to patient",
        "appointment": {
            "id": str(appt.id),
            "doctorId": appt.doctorId,
            "patientId": appt.patientId,
            "patientName": appt.patientName,
            "doctorName": appt.doctorName,
            "startTimestamp": appt.startTimestamp.isoformat(),
            "endTimestamp": appt.endTimestamp.isoformat() if appt.endTimestamp else None,
            "proposedStartTimestamp": appt.proposedStartTimestamp.isoformat() if appt.proposedStartTimestamp else None,
            "proposedEndTimestamp": appt.proposedEndTimestamp.isoformat() if appt.proposedEndTimestamp else None,
            "status": appt.status,
            "isRescheduledBy": appt.isRescheduledBy,
            "notes": appt.notes,
            "rescheduleReason": getattr(appt, 'rescheduleReason', None),
            "updatedAt": appt.updatedAt.isoformat(),
        }
    }), 200


@appt_bp.route('/<appointment_id>/reschedule/accept', methods=['POST'])
@jwt_required()
def accept_reschedule(appointment_id):
    """
    Accept a reschedule proposal
    - Patient accepts doctor_rescheduled_pending → confirmed (with new time)
    - Doctor accepts patient_rescheduled_pending → confirmed (with new time)
    """
    user_id = get_jwt_identity()
    
    appt = Appointment.objects(id=appointment_id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Verify user is authorized
    if appt.status == 'doctor_rescheduled_pending':
        # Patient must accept
        if appt.patientId != user_id:
            return jsonify({"error": "Unauthorized"}), 403
    elif appt.status == 'patient_rescheduled_pending':
        # Doctor must accept
        if appt.doctorId != user_id:
            return jsonify({"error": "Unauthorized"}), 403
    else:
        return jsonify({"error": f"No pending reschedule to accept (status: {appt.status})"}), 400
    
    # Apply proposed time
    if not appt.proposedStartTimestamp:
        return jsonify({"error": "No proposed time found"}), 400
    
    appt.startTimestamp = appt.proposedStartTimestamp
    appt.endTimestamp = appt.proposedEndTimestamp
    appt.proposedStartTimestamp = None
    appt.proposedEndTimestamp = None
    appt.status = 'confirmed'
    appt.isRescheduledBy = None
    appt.updatedAt = get_ist_now()
    appt.save()
    
    # Send confirmation email
    if appt.patientId == user_id:
        # Patient accepted, notify doctor
        doctor_email = get_user_email(appt.doctorId)
        if doctor_email:
            email_service.send_reschedule_accepted(
                doctor_email,
                appt.doctorName,
                appt.patientName,
                format_appointment_time(appt.startTimestamp)
            )
    else:
        # Doctor accepted, notify patient
        patient_email = get_user_email(appt.patientId)
        if patient_email:
            email_service.send_reschedule_accepted(
                patient_email,
                appt.patientName,
                appt.doctorName,
                format_appointment_time(appt.startTimestamp)
            )
    
    return jsonify({
        "message": "Reschedule accepted. Appointment confirmed with new time.",
        "status": "confirmed"
    }), 200


@appt_bp.route('/<appointment_id>/reschedule/reject', methods=['POST'])
@jwt_required()
def reject_reschedule(appointment_id):
    """
    Reject a reschedule proposal
    - Patient rejects doctor_rescheduled_pending → confirmed (original time)
    - Doctor rejects patient_rescheduled_pending → confirmed (original time)
    """
    user_id = get_jwt_identity()
    
    appt = Appointment.objects(id=appointment_id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Verify user is authorized
    if appt.status == 'doctor_rescheduled_pending':
        # Patient can reject OR Doctor can withdraw
        if appt.patientId != user_id and appt.doctorId != user_id:
            return jsonify({"error": "Unauthorized"}), 403
    elif appt.status == 'patient_rescheduled_pending':
        # Doctor can reject OR Patient can withdraw
        if appt.doctorId != user_id and appt.patientId != user_id:
            return jsonify({"error": "Unauthorized"}), 403
    else:
        return jsonify({"error": f"No pending reschedule to reject (status: {appt.status})"}), 400
    proposedStartTimestamp = appt.proposedStartTimestamp
   
    # Clear proposed time and revert to confirmed
    appt.proposedStartTimestamp = None
    appt.proposedEndTimestamp = None
    appt.status = 'confirmed'
    appt.isRescheduledBy = None
    appt.updatedAt = get_ist_now()
    appt.save()
    
    # Send notification email
    if appt.patientId == user_id:
        # Patient rejected, notify doctor
        doctor_email = get_user_email(appt.doctorId)
        if doctor_email:
            email_service.send_reschedule_rejected_to_doctor(
                doctor_email,
                appt.doctorName,
                appt.patientName,
                format_appointment_time(appt.startTimestamp),
                format_appointment_time(proposedStartTimestamp)
            )
    else:
        # Doctor rejected, notify patient
        patient_email = get_user_email(appt.patientId)
        if patient_email:
            email_service.send_reschedule_rejected_to_patient(
                patient_email,
                appt.doctorName,
                appt.patientName,
                format_appointment_time(appt.startTimestamp),
                format_appointment_time(proposedStartTimestamp)
            )
    
    return jsonify({
        "message": "Reschedule rejected. Appointment remains at original time.",
        "status": "confirmed"
    }), 200


# ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

@appt_bp.route('/', methods=['GET'])
@jwt_required()
def get_appointments():
    """Legacy endpoint - redirects to /me"""
    return get_my_appointments()


@appt_bp.route('/doctor/<doctor_id>', methods=['GET'])
@jwt_required()
def get_doctor_appointments(doctor_id):
    """Legacy endpoint - redirects to /doctor/<id>/upcoming"""
    return get_doctor_upcoming_appointments(doctor_id)


# ==================== ASSESSMENT ENDPOINTS ====================

@appt_bp.route('/assessments', methods=['POST'])
@jwt_required()
def create_assessment():
    """Create a new assessment for a patient (doctor only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects(uid=current_user_id).first()
        
        if not user or user.role != 'doctor':
            return jsonify({'error': 'Only doctors can create assessments'}), 403
        
        data = request.get_json()
        patient_id = data.get('patientId')
        
        if not patient_id:
            return jsonify({'error': 'Patient ID is required'}), 400
        
        # Verify patient exists
        patient = Patient.objects(patientId=patient_id).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Generate unique assessment ID
        import uuid
        assessment_id = f"ASMT-{uuid.uuid4().hex[:12].upper()}"
        
        # Create assessment
        assessment = Assessment(
            assessmentId=assessment_id,
            patientId=patient_id,
            doctorId=current_user_id,
            assessment=data.get('assessment', {}),
            healthHistory=data.get('healthHistory', ''),
            medicalConditions=data.get('medicalConditions', ''),
            lifestyle=data.get('lifestyle', ''),
            dietaryHabits=data.get('dietaryHabits', ''),
            symptoms=data.get('symptoms', ''),
            activityLevel=data.get('activityLevel', ''),
            sleepPattern=data.get('sleepPattern', ''),
            notes=data.get('notes', '')
        )
        assessment.save()
        
        # Return assessment data
        return jsonify({
            'message': 'Assessment created successfully',
            'assessment': {
                'assessmentId': assessment.assessmentId,
                'patientId': assessment.patientId,
                'doctorId': assessment.doctorId,
                'createdAt': assessment.createdAt.isoformat(),
                'assessment': assessment.assessment,
                'healthHistory': assessment.healthHistory,
                'medicalConditions': assessment.medicalConditions,
                'lifestyle': assessment.lifestyle,
                'dietaryHabits': assessment.dietaryHabits,
                'symptoms': assessment.symptoms,
                'activityLevel': assessment.activityLevel,
                'sleepPattern': assessment.sleepPattern,
                'notes': assessment.notes
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appt_bp.route('/assessments/patient/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient_assessments(patient_id):
    """Get all assessments for a specific patient"""
    try:
        # Fetch all assessments for the patient, sorted by newest first
        assessments = Assessment.objects(patientId=patient_id).order_by('-createdAt')
        
        # Get doctor names for each assessment
        assessment_list = []
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        
        for asmt in assessments:
            doctor = User.objects(uid=asmt.doctorId).first()
            doctor_name = doctor.name if doctor else "Unknown Doctor"
            
            # Ensure timestamps are in IST
            created_at = asmt.createdAt
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            created_at = created_at.astimezone(ist_tz).isoformat()
            
            updated_at = None
            if asmt.updatedAt:
                updated_at_dt = asmt.updatedAt
                if updated_at_dt.tzinfo is None:
                    updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)
                updated_at = updated_at_dt.astimezone(ist_tz).isoformat()
            
            assessment_list.append({
                'assessmentId': asmt.assessmentId,
                'patientId': asmt.patientId,
                'doctorId': asmt.doctorId,
                'doctorName': doctor_name,
                'createdAt': created_at,
                'assessment': asmt.assessment,
                'healthHistory': asmt.healthHistory,
                'medicalConditions': asmt.medicalConditions,
                'lifestyle': asmt.lifestyle,
                'dietaryHabits': asmt.dietaryHabits,
                'symptoms': asmt.symptoms,
                'notes': asmt.notes,
                'updatedAt': updated_at
            })
        
        return jsonify({
            'assessments': assessment_list,
            'count': len(assessment_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appt_bp.route('/assessments/doctor/<doctor_id>', methods=['GET'])
@jwt_required()
def get_doctor_assessments(doctor_id):
    """Get all assessments created by a specific doctor"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify the requesting user is the doctor or an admin
        user = User.objects(uid=current_user_id).first()
        if not user or (user.uid != doctor_id and user.role != 'admin'):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Fetch all assessments by the doctor, sorted by newest first
        assessments = Assessment.objects(doctorId=doctor_id).order_by('-createdAt')
        
        # Get patient names for each assessment
        assessment_list = []
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        
        for asmt in assessments:
            patient = Patient.objects(patientId=asmt.patientId).first()
            patient_name = patient.name if patient else "Unknown Patient"
            
            # Ensure timestamps are in IST
            created_at = asmt.createdAt
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            created_at = created_at.astimezone(ist_tz).isoformat()
            
            updated_at = None
            if asmt.updatedAt:
                updated_at_dt = asmt.updatedAt
                if updated_at_dt.tzinfo is None:
                    updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)
                updated_at = updated_at_dt.astimezone(ist_tz).isoformat()
            
            assessment_list.append({
                'assessmentId': asmt.assessmentId,
                'patientId': asmt.patientId,
                'patientName': patient_name,
                'doctorId': asmt.doctorId,
                'createdAt': created_at,
                'assessment': asmt.assessment,
                'healthHistory': asmt.healthHistory,
                'medicalConditions': asmt.medicalConditions,
                'lifestyle': asmt.lifestyle,
                'dietaryHabits': asmt.dietaryHabits,
                'symptoms': asmt.symptoms,
                'notes': asmt.notes,
                'updatedAt': updated_at
            })
        
        return jsonify({
            'assessments': assessment_list,
            'count': len(assessment_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appt_bp.route('/assessments/<assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment(assessment_id):
    """Get a specific assessment by ID"""
    try:
        assessment = Assessment.objects(assessmentId=assessment_id).first()
        
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        
        # Get doctor and patient names
        doctor = User.objects(uid=assessment.doctorId).first()
        patient = Patient.objects(patientId=assessment.patientId).first()
        
        return jsonify({
            'assessment': {
                'assessmentId': assessment.assessmentId,
                'patientId': assessment.patientId,
                'patientName': patient.name if patient else "Unknown",
                'doctorId': assessment.doctorId,
                'doctorName': doctor.name if doctor else "Unknown",
                'createdAt': assessment.createdAt.isoformat(),
                'assessment': assessment.assessment,
                'healthHistory': assessment.healthHistory,
                'medicalConditions': assessment.medicalConditions,
                'lifestyle': assessment.lifestyle,
                'dietaryHabits': assessment.dietaryHabits,
                'symptoms': assessment.symptoms,
                'notes': assessment.notes,
                'updatedAt': assessment.updatedAt.isoformat() if assessment.updatedAt else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appt_bp.route('/assessments/<assessment_id>/notes', methods=['PATCH'])
@jwt_required()
def update_assessment_notes(assessment_id):
    """Update notes for an assessment (doctor only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects(uid=current_user_id).first()
        
        if not user or user.role != 'doctor':
            return jsonify({'error': 'Only doctors can update assessments'}), 403
        
        assessment = Assessment.objects(assessmentId=assessment_id).first()
        
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        
        # Verify the doctor owns this assessment
        if assessment.doctorId != current_user_id:
            return jsonify({'error': 'You can only update your own assessments'}), 403
        
        data = request.get_json()
        notes = data.get('notes', '')
        
        assessment.notes = notes
        assessment.updatedAt = get_ist_now()
        assessment.save()
        
        return jsonify({
            'message': 'Notes updated successfully',
            'assessment': {
                'assessmentId': assessment.assessmentId,
                'notes': assessment.notes,
                'updatedAt': assessment.updatedAt.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appt_bp.route('/doctor/patients', methods=['GET'])
@jwt_required()
def get_doctor_patients():
    """
    Get patients who have confirmed or completed appointments with the current doctor.
    Only returns patients with at least one confirmed or completed appointment.
    """
    try:
        # Auto-complete past confirmed appointments
        auto_complete_appointments()
        
        current_user_id = get_jwt_identity()
        user = User.objects(uid=current_user_id).first()
        
        if not user or user.role != 'doctor':
            return jsonify({'error': 'Only doctors can access this endpoint'}), 403
        
        # Find all appointments for this doctor with confirmed or completed status
        appointments = Appointment.objects(
            doctorId=current_user_id,
            status__in=['confirmed', 'completed']
        ).order_by('-startTimestamp')
        
        # Extract unique patient IDs and track last appointment for each
        patient_appointments = {}
        for appt in appointments:
            if appt.patientId not in patient_appointments:
                patient_appointments[appt.patientId] = {
                    'lastAppointmentDate': appt.startTimestamp,
                    'lastAppointmentStatus': appt.status
                }
        
        # Fetch patient details for unique patient IDs
        patient_ids = list(patient_appointments.keys())
        patients = Patient.objects(patientId__in=patient_ids)
        
        # Build response with patient info and last appointment details
        patient_list = []
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        
        for patient in patients:
            last_appt_info = patient_appointments.get(patient.patientId, {})
            
            # Convert timestamp to IST
            last_appt_date = last_appt_info.get('lastAppointmentDate')
            if last_appt_date:
                if last_appt_date.tzinfo is None:
                    last_appt_date = last_appt_date.replace(tzinfo=timezone.utc)
                last_appt_date = last_appt_date.astimezone(ist_tz).isoformat()
            
            patient_list.append({
                'id': str(patient.id),
                'patientId': patient.patientId,
                'name': patient.name,
                'assessment': patient.assessment or {},
                'lastAppointment': {
                    'date': last_appt_date,
                    'status': last_appt_info.get('lastAppointmentStatus')
                } if last_appt_info else None
            })
        
        # Sort by last appointment date (most recent first)
        patient_list.sort(
            key=lambda x: x['lastAppointment']['date'] if x['lastAppointment'] else '',
            reverse=True
        )
        
        return jsonify({
            'patients': patient_list,
            'count': len(patient_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
