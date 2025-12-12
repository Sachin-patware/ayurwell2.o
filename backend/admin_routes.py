from flask import Blueprint, request, jsonify
from models import User, Patient, Doctor
from flask_jwt_extended import jwt_required
from admin_middleware import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/patients', methods=['GET'])
@jwt_required()
@admin_required
def get_all_patients():
    """Get all patients in the system"""
    try:
        patients = Patient.objects()
        
        results = []
        for patient in patients:
            # Fetch user info for email
            user = User.objects(uid=patient.patientId).first()
            
            results.append({
                "patientId": patient.patientId,
                "name": patient.name,
                "phone": patient.personalInfo.get('phone', '') if patient.personalInfo else '',
                "email": user.email if user else "",
                "createdAt": patient.createdAt.isoformat() if patient.createdAt else None,

            })
        
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/doctors', methods=['GET'])
@jwt_required()
@admin_required
def get_all_doctors():
    """Get all doctors in the system"""
    try:
        doctors = Doctor.objects()
        
        results = []
        for doctor in doctors:
            # Fetch user info for email
            user = User.objects(uid=doctor.doctorId).first()
            
            results.append({
                "doctorId": doctor.doctorId,
                "name": doctor.name,
                "email": user.email if user else "",
                "specialization": doctor.specialization,
                "status": doctor.account.get('status', 'pending') if doctor.account else 'pending',
                "createdAt": doctor.createdAt.isoformat() if doctor.createdAt else None,
                "clinicHours": doctor.clinicHours
            })
        
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/user/<uid>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(uid):
    """Delete a user and their associated records"""
    try:
        # Find the user
        user = User.objects(uid=uid).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        role = user.role
        
        # Delete associated records based on role
        if role == 'patient':
            # Delete patient record
            patient = Patient.objects(patientId=uid).first()
            if patient:
                patient.delete()
            
            # Delete diet plans
            from models import DietPlan
            DietPlan.objects(patientId=uid).delete()
            
            # Delete progress records
            from models import Progress
            Progress.objects(patientId=uid).delete()
            
        elif role == 'doctor':
            # Delete doctor record
            doctor = Doctor.objects(doctorId=uid).first()
            if doctor:
                doctor.delete()
        
        # Delete appointments
        from models import Appointment
        Appointment.objects(patientId=uid).delete()
        Appointment.objects(doctorId=uid).delete()
        
        # Finally delete the user
        user.delete()
        
        return jsonify({
            "message": f"User {uid} and all associated records deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/doctor/verify/<doctor_id>', methods=['PUT'])
@jwt_required()
@admin_required
def verify_doctor(doctor_id):
    """Approve/verify a doctor profile"""
    try:
        doctor = Doctor.objects(doctorId=doctor_id).first()
        if not doctor:
            return jsonify({"error": "Doctor not found"}), 404
        
        # Update account status to verified
        if not doctor.account:
            doctor.account = {}
        
        doctor.account['status'] = 'verified'
        doctor.save()
        
        return jsonify({
            "message": f"Doctor {doctor.name} verified successfully",
            "doctorId": doctor_id,
            "status": "verified"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_stats():
    """Get system statistics"""
    try:
        total_patients = Patient.objects.count()
        total_doctors = Doctor.objects.count()
        verified_doctors = Doctor.objects(account__status='verified').count()
        pending_doctors = total_doctors - verified_doctors
        
        from models import Appointment
        total_appointments = Appointment.objects.count()
        
        return jsonify({
            "totalPatients": total_patients,
            "totalDoctors": total_doctors,
            "verifiedDoctors": verified_doctors,
            "pendingDoctors": pending_doctors,
            "totalAppointments": total_appointments
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
