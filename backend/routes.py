from flask import Blueprint, request, jsonify
from models import Patient, DietPlan, Doctor, get_ist_now
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

# Patient endpoints
@api_bp.route('/patients', methods=['POST'])
@jwt_required()
def add_patient():
    data = request.json
    current_user = get_jwt_identity()
    
    new_patient = Patient(
        patientId=data.get('patientId', current_user),
        name=data['name'],
    )
    new_patient.save()
    return jsonify({"message": "Patient added", "id": str(new_patient.id)}), 201

@api_bp.route('/patients/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    try:
        patient = Patient.objects(patientId=patient_id).first()
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        
        response_data = {
            "patientId": patient.patientId,
            "name": patient.name,
        }

        # If assessment was created by a doctor, fetch doctor's name
        if patient.assessmentCreatedBy:
            doctor = Doctor.objects(doctorId=patient.assessmentCreatedBy).first()
            if doctor:
                response_data['assessmentDoctorName'] = doctor.name
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/patients/<patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    data = request.json
    patient = Patient.objects(patientId=patient_id).first()
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
        
    if 'assessment' in data:
        patient.assessment = data['assessment']
        # If the updater is a doctor (we can check if they are in Doctor collection or just assume based on role if we had it in JWT)
        # For now, we'll assume the current user is the one creating/updating it.
        # Ideally we should check if current_user is a doctor.
        current_user = get_jwt_identity()
        # Check if user is a doctor
        is_doctor = Doctor.objects(doctorId=current_user).first() is not None
        
        if is_doctor:
            patient.assessmentCreatedBy = current_user
            patient.assessmentCreatedAt = get_ist_now()
    
    if 'healthHistory' in data:
        patient.healthHistory = data['healthHistory']
        
    
    patient.save()
    return jsonify({"message": "Patient updated successfully"}), 200


# Doctor endpoints
@api_bp.route('/doctors', methods=['GET'])
def get_doctors():
    doctors = Doctor.objects(status='verified')
    return jsonify([{
        "doctorId": d.doctorId,
        "name": d.name,
        "specialization": d.specialization,
        "clinicHours": d.clinicHours
    } for d in doctors])

# Diet plan endpoints
@api_bp.route('/generate-diet', methods=['POST'])
@jwt_required()
def generate_diet_plan():
    data = request.json
    patient_id = data.get('patient_id')
    current_user = get_jwt_identity()
    
    patient = Patient.objects(patientId=patient_id).first()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
        
    # Use the ML Service
    from ml_service import ml_service
    
    # Construct profile from assessment
    assessment_data = data.get('assessment_data')
    
    if assessment_data and 'assessment' in assessment_data:
        # If full assessment object passed (from Assessment collection)
        assessment = assessment_data['assessment']
    elif assessment_data:
        # If just the assessment fields passed
        assessment = assessment_data
    else:
        # Fallback to patient's embedded assessment
        assessment = patient.assessment or {}

    profile = {
        "prakriti": assessment.get('prakriti'),
        "vikriti": assessment.get('vikriti'),
        "age": assessment.get('age'),
        "gender": assessment.get('gender')
    }
    
    diet_plan_content = ml_service.generate_diet(profile)
    
    # Save as draft by default (doctor must publish)
    new_plan = DietPlan(
        patientId=patient_id,
        content=json.dumps(diet_plan_content),
        createdBy=current_user,
        published=False,
        status='draft'
    )
    new_plan.save()
    
    return jsonify({
        "message": "Diet plan generated as draft", 
        "diet_plan": diet_plan_content,
        "plan_id": str(new_plan.id)
    }), 201

@api_bp.route('/diet-plans/<patient_id>', methods=['GET'])
@jwt_required()
def get_diet_plans(patient_id):
    """Get diet plans - only published plans for patients, all for doctors"""
    current_user = get_jwt_identity()
    
    # Check if current user is the patient or a doctor
    patient = Patient.objects(patientId=patient_id).first()
    is_patient_viewing_own = (current_user == patient_id)
    
    if is_patient_viewing_own:
        # Patients only see published plans
        plans = DietPlan.objects(patientId=patient_id, published=True)
    else:
        # Doctors see all plans (drafts + published)
        plans = DietPlan.objects(patientId=patient_id)
    
    return jsonify([{
        "id": str(p.id),
        "generatedAt": p.generatedAt.isoformat(),
        "content": json.loads(p.content) if p.content else {},
        "createdBy": p.createdBy,
        "published": p.published,
        "status": p.status,
        "publishedAt": p.publishedAt.isoformat() if p.publishedAt else None,
        "lastModified": p.lastModified.isoformat() if p.lastModified else None
    } for p in plans])

@api_bp.route('/diet-plans/save-draft', methods=['POST'])
@jwt_required()
def save_diet_plan_draft():
    """Save or update a diet plan as draft"""
    from datetime import datetime
    data = request.json
    current_user = get_jwt_identity()
    
    plan_id = data.get('plan_id')
    patient_id = data.get('patient_id')
    content = data.get('content')
    
    if plan_id:
        # Update existing draft
        plan = DietPlan.objects(id=plan_id).first()
        if not plan:
            return jsonify({"error": "Diet plan not found"}), 404
        
        plan.content = json.dumps(content)
        plan.lastModified = get_ist_now()
        plan.save()
        
        return jsonify({"message": "Draft updated", "plan_id": str(plan.id)}), 200
    else:
        # Create new draft
        new_plan = DietPlan(
            patientId=patient_id,
            content=json.dumps(content),
            createdBy=current_user,
            published=False,
            status='draft'
        )
        new_plan.save()
        
        return jsonify({"message": "Draft saved", "plan_id": str(new_plan.id)}), 201

@api_bp.route('/diet-plans', methods=['GET'])
@jwt_required()
def get_all_diet_plans():
    """Get all diet plans for practitioner dashboard"""
    plans = DietPlan.objects().order_by('-lastModified')
    
    # We need to fetch patient names for display
    results = []
    for p in plans:
        patient = Patient.objects(patientId=p.patientId).first()
        content = json.loads(p.content) if p.content else {}
        
        # Calculate total calories if available in the plan
        calories = 0
        if 'summary' in content and 'totalCalories' in content['summary']:
            calories = content['summary']['totalCalories']
        elif 'mealPlan' in content:
            # Estimate or extract from first day if not in summary
            pass
            
        results.append({
            "id": str(p.id),
            "patientId": p.patientId,
            "patientName": patient.name if patient else "Unknown",
            "generatedAt": p.generatedAt.isoformat(),
            "lastModified": p.lastModified.isoformat() if p.lastModified else p.generatedAt.isoformat(),
            "status": p.status,
            "calories": calories
        })
        
    return jsonify(results)

@api_bp.route('/diet-plans/<plan_id>/status', methods=['PUT'])
@jwt_required()
def update_diet_plan_status(plan_id):
    """Update diet plan status (e.g. Active, Completed, Cancelled)"""
    try:
        data = request.json
        new_status = data.get('status')
        
        # Allow 'active' as a status, mapping it to 'published' internally if needed, 
        # but keeping the status field flexible for UI display
        valid_statuses = ['draft', 'published', 'active', 'completed', 'cancelled']
        if not new_status or new_status.lower() not in valid_statuses:
            return jsonify({"error": "Invalid status"}), 400
            
        plan = DietPlan.objects(id=plan_id).first()
        if not plan:
            return jsonify({"error": "Diet plan not found"}), 404
            
        plan.status = new_status
        plan.lastModified = get_ist_now()  # Update last modified timestamp
        
        # If setting to active/published, ensure published flag is true
        if new_status.lower() in ['active', 'published']:
            plan.published = True
            if not plan.publishedAt:
                plan.publishedAt = get_ist_now()
                
        plan.save()
        return jsonify({
            "message": f"Status updated to {new_status}",
            "lastModified": plan.lastModified.isoformat() if plan.lastModified else None
        }), 200
    except Exception as e:
        print(f"Error updating status: {str(e)}")
        return jsonify({"error": f"Failed to update status: {str(e)}"}), 500

@api_bp.route('/diet-plans/<plan_id>/publish', methods=['PUT'])
@jwt_required()
def publish_diet_plan(plan_id):
    """Publish a diet plan to make it visible to patient"""
    from datetime import datetime
    
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    plan.published = True
    plan.status = 'published'
    plan.publishedAt = get_ist_now()
    plan.lastModified = get_ist_now()
    plan.save()
    
    return jsonify({"message": "Diet plan published successfully"}), 200

@api_bp.route('/diet-plans/<plan_id>', methods=['PUT'])
@jwt_required()
def update_diet_plan(plan_id):
    """Update an existing diet plan"""
    from datetime import datetime
    data = request.json
    
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    if 'content' in data:
        plan.content = json.dumps(data['content'])
    
    plan.lastModified = get_ist_now()
    plan.save()
    
    return jsonify({"message": "Diet plan updated"}), 200

# Progress tracking endpoints
@api_bp.route('/progress', methods=['POST'])
@jwt_required()
def log_progress():
    from models import Progress
    data = request.json
    current_user = get_jwt_identity()
    
    progress = Progress(
        patientId=data.get('patientId', current_user),
        waterIntake=data.get('waterIntake'),
        bowelMovement=data.get('bowelMovement'),
        symptoms=data.get('symptoms', ''),
        mealAdherence=data.get('mealAdherence'),
        weight=data.get('weight'),
        notes=data.get('notes', '')
    )
    progress.save()
    
    return jsonify({"message": "Progress logged", "id": str(progress.id)}), 201

@api_bp.route('/progress/<patient_id>', methods=['GET'])
@jwt_required()
def get_progress(patient_id):
    from models import Progress
    progress_records = Progress.objects(patientId=patient_id).order_by('-date')
    
    return jsonify([{
        "id": str(p.id),
        "date": p.date.isoformat(),
        "waterIntake": p.waterIntake,
        "bowelMovement": p.bowelMovement,
        "symptoms": p.symptoms,
        "mealAdherence": p.mealAdherence,
        "weight": p.weight,
        "notes": p.notes
    } for p in progress_records])

@api_bp.route('/progress/<progress_id>', methods=['DELETE'])
@jwt_required()
def delete_progress(progress_id):
    from models import Progress
    progress = Progress.objects(id=progress_id).first()
    
    if not progress:
        return jsonify({"error": "Progress entry not found"}), 404
    
    progress.delete()
    return jsonify({"message": "Progress entry deleted successfully"}), 200


# Practitioner Profile Endpoints
@api_bp.route('/practitioner/profile', methods=['GET'])
@jwt_required()
def get_practitioner_profile():
    current_user_id = get_jwt_identity()
    doctor = Doctor.objects(doctorId=current_user_id).first()
    
    if not doctor:
        return jsonify({"error": "Doctor profile not found"}), 404
    
    # Fetch email and name from User collection to ensure sync
    from models import User
    user = User.objects(uid=current_user_id).first()
    email = user.email if user else ""
    name = user.name if user else doctor.name
        
    # Merge email/name into personalInfo for frontend convenience
    personal_info = doctor.personalInfo or {}
    personal_info['email'] = email
    personal_info['name'] = name
        
    return jsonify({
        "doctorId": doctor.doctorId,
        "name": name,
        "specialization": doctor.specialization,
        "clinicHours": doctor.clinicHours,
        "status": doctor.status,
        "personalInfo": personal_info,
        "professionalInfo": doctor.professionalInfo,
        "clinicInfo": doctor.clinicInfo,
        "account": doctor.account,
        "createdAt": doctor.createdAt.isoformat() if doctor.createdAt else None
    })

@api_bp.route('/practitioner/profile', methods=['PUT'])
@jwt_required()
def update_practitioner_profile():
    current_user_id = get_jwt_identity()
    data = request.json
    
    doctor = Doctor.objects(doctorId=current_user_id).first()
    
    if not doctor:
        return jsonify({"error": "Doctor profile not found"}), 404
    
    # Update top-level fields
    if 'specialization' in data:
        doctor.specialization = data['specialization']
    if 'clinicHours' in data:
        doctor.clinicHours = data['clinicHours']
        
    # Update rich fields
    if 'personalInfo' in data:
        doctor.personalInfo = data['personalInfo']
        
        # Sync Name with User collection if changed
        if 'name' in data['personalInfo']:
            new_name = data['personalInfo']['name']
            doctor.name = new_name
            
            from models import User
            user = User.objects(uid=current_user_id).first()
            if user:
                user.name = new_name
                user.save()
            
    if 'professionalInfo' in data:
        doctor.professionalInfo = data['professionalInfo']
        # Sync top-level specialization
        if 'specialization' in data['professionalInfo']:
            doctor.specialization = data['professionalInfo']['specialization']
            
    if 'clinicInfo' in data:
        doctor.clinicInfo = data['clinicInfo']
        # Sync top-level clinicHours
        if 'clinicHours' in data['clinicInfo']:
            doctor.clinicHours = data['clinicInfo']['clinicHours']
            
    if 'account' in data:
        # Don't allow updating critical account fields directly via this endpoint if needed
        # But for now, we'll allow updating profileImage etc.
        doctor.account = data['account']
        
    doctor.save()
    
    return jsonify({"message": "Profile updated successfully"}), 200
