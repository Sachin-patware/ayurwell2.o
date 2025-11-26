from flask import Blueprint, request, jsonify
from models import Appointment, User, Patient, Doctor
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

appt_bp = Blueprint('appointments', __name__)

# --- Appointments ---

@appt_bp.route('/', methods=['GET'])
@jwt_required()
def get_appointments():
    user_id = get_jwt_identity()
    user = User.objects(uid=user_id).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role == 'doctor':
        appointments = Appointment.objects(doctorId=user_id)
    else:
        appointments = Appointment.objects(patientId=user_id)
    
    return jsonify([{
        "id": str(a.id),
        "doctorId": a.doctorId,
        "patientId": a.patientId,
        "doctorName": a.doctorName,
        "patientName": a.patientName,
        "startTimestamp": a.startTimestamp.isoformat(),
        "endTimestamp": a.endTimestamp.isoformat() if a.endTimestamp else None,
        "status": a.status,
        "notes": a.notes
    } for a in appointments]), 200

@appt_bp.route('/doctor/<doctor_id>', methods=['GET'])
@jwt_required()
def get_doctor_appointments(doctor_id):
    """Get all appointments for a specific doctor (for checking availability)"""
    # Fetch all upcoming appointments for this doctor
    appointments = Appointment.objects(doctorId=doctor_id, status='upcoming')
    
    return jsonify([{
        "id": str(a.id),
        "doctorId": a.doctorId,
        "startTimestamp": a.startTimestamp.isoformat(),
        "status": a.status
    } for a in appointments]), 200

@appt_bp.route('/', methods=['POST'])
@jwt_required()
def create_appointment():
    user_id = get_jwt_identity()
    data = request.json
    
    doctor_id = data.get('doctor_id')
    start_time = data.get('startTimestamp')
    notes = data.get('notes')
    
    if not doctor_id or not start_time:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Get patient and doctor info
    patient = Patient.objects(patientId=user_id).first()
    doctor = Doctor.objects(doctorId=doctor_id).first()
    
    if not patient or not doctor:
        return jsonify({"error": "Patient or Doctor not found"}), 404
        
    try:
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    appt = Appointment(
        patientId=user_id,
        doctorId=doctor_id,
        patientName=patient.name,
        doctorName=doctor.name,
        startTimestamp=start_dt,
        notes=notes
    )
    appt.save()
    
    return jsonify({"message": "Appointment booked", "id": str(appt.id)}), 201

@appt_bp.route('/<id>', methods=['PUT'])
@jwt_required()
def update_appointment(id):
    user_id = get_jwt_identity()
    data = request.json
    status = data.get('status')
    start_time = data.get('startTimestamp')
    
    appt = Appointment.objects(id=id).first()
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
        
    # Only allow participants to update
    if appt.doctorId != user_id and appt.patientId != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Update status if provided
    if status:
        appt.status = status
    
    # Update startTimestamp if provided (for rescheduling)
    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            appt.startTimestamp = start_dt
        except ValueError:
            return jsonify({"error": "Invalid date format"}), 400
    
    appt.save()
        
    return jsonify({"message": "Appointment updated successfully"}), 200


