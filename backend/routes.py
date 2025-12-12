from flask import Blueprint, request, jsonify
from models import Patient, DietPlan, Doctor, get_ist_now
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from ml_service import ml_service

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
        
    
    patient.save()
    return jsonify({"message": "Patient updated successfully"}), 200


# Doctor endpoints
@api_bp.route('/doctors', methods=['GET'])
def get_doctors():
    doctors = Doctor.objects(account__status='verified')
    return jsonify([{
        "doctorId": d.doctorId,
        "name": d.name,
        "specialization": d.specialization,
        "clinicHours": d.clinicHours
    } for d in doctors])

# Diet plan endpoints

def validate_status_transition(current_status, new_status):
    """Validate diet plan status transitions"""
    allowed_transitions = {
        'draft': ['active', 'cancelled'],
        'active': ['completed', 'cancelled'],
        'completed': [],  # terminal
        'cancelled': []   # terminal
    }
    
    if new_status not in allowed_transitions.get(current_status, []):
        raise ValueError(f"Invalid transition from {current_status} to {new_status}")

@api_bp.route('/generate-diet', methods=['POST'])
@jwt_required()
def generate_diet_plan():
    try:
        data = request.json
        patient_id = data.get('patient_id')
        # Get assessment data from request (required)
        assessment_data = data.get('assessment_data')
        
        if not patient_id:
            return jsonify({"error": "Patient ID is required"}), 400
        
        if not assessment_data:
            return jsonify({"error": "Assessment data is required for diet generation"}), 400
            
        patient = Patient.objects(patientId=patient_id).first()
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        
        assessment_source = assessment_data

        # Helper to safely extracting data whether it's flat or nested in 'assessment' key
        # (Handling inconsistency where sometimes data is top-level and sometimes in 'assessment' key)
        def get_val(key):
            val = assessment_source.get(key)
            if val is None and 'assessment' in assessment_source:
                val = assessment_source['assessment'].get(key)
            return val

        vikriti_val = get_val('vikriti')
        if vikriti_val == 'Auto Detect':
            vikriti_val = None

        profile = {
            'Age': get_val('age'),
            'Gender': get_val('gender'),
            'Prakriti': get_val('prakriti'),
            'Vikriti': vikriti_val,
            'ActivityLevel': get_val('activityLevel'),
            'SleepPattern': get_val('sleepPattern'),
            'DietaryHabits': get_val('dietaryHabits'),
            'Lifestyle': get_val('lifestyle'),
            'Symptoms': get_val('symptoms')
        }
        
        # Basic validation for critical fields
        if not profile['Prakriti']:
             return jsonify({"error": "Prakriti is required for diet generation"}), 400

        diet_plan_content = ml_service.generate_diet(profile)
        
        return jsonify({
            "message": "Diet plan generated successfully", 
            "diet_plan": diet_plan_content
        }), 200
        
    except Exception as e:
        print(f"Error generating diet plan: {str(e)}")
        return jsonify({"error": f"Failed to generate diet plan: {str(e)}"}), 500

@api_bp.route('/diet-plans/<patient_id>', methods=['GET'])
@jwt_required()
def get_diet_plans(patient_id):
    """Get diet plans - only published plans for patients, all for doctors"""
    current_user = get_jwt_identity()
    
    # Check if current user is the patient or a doctor
    patient = Patient.objects(patientId=patient_id).first()
    is_patient_viewing_own = (current_user == patient_id)
    
    if is_patient_viewing_own:
        # Patients only see active, completed, or cancelled plans
        plans = DietPlan.objects(patientId=patient_id, status__in=['active', 'completed', 'cancelled']).order_by('-lastModified')
    else:
        # Doctors see all plans (drafts + active + etc)
        plans = DietPlan.objects(patientId=patient_id).order_by('-lastModified')
    
    results = []
    for p in plans:
        # Fetch doctor name for each plan
        doctor_name = "Unknown"
        if p.createdBy:
            doctor = Doctor.objects(doctorId=p.createdBy).first()
            if doctor:
                doctor_name = doctor.name
        
        results.append({
            "id": str(p.id),
            "generatedAt": p.generatedAt.isoformat(),
            "content": json.loads(p.content) if p.content else {},
            "createdBy": p.createdBy,
            "doctorName": doctor_name,
            "status": p.status,
            "publishedAt": p.publishedAt.isoformat() if p.publishedAt else None,
            "lastModified": p.lastModified.isoformat() if p.lastModified else None
        })
    
    return jsonify(results)

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
            status='draft'
        )
        new_plan.save()
        
        return jsonify({"message": "Draft saved", "plan_id": str(new_plan.id)}), 201

@api_bp.route('/diet-plans/save-and-publish', methods=['POST'])
@jwt_required()
def save_and_publish_diet_plan():
    """Save a new diet plan and immediately publish it"""
    from datetime import datetime
    data = request.json
    current_user = get_jwt_identity()
    
    patient_id = data.get('patient_id')
    content = data.get('content')
    
    if not patient_id or not content:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Create new plan with active status
    new_plan = DietPlan(
        patientId=patient_id,
        content=json.dumps(content),
        createdBy=current_user,
        status='active',
        publishedAt=get_ist_now()
    )
    new_plan.save()
    
    return jsonify({
        "message": "Diet plan published successfully", 
        "plan_id": str(new_plan.id)
    }), 201

@api_bp.route('/diet-plans', methods=['GET'])
@jwt_required()
def get_all_diet_plans():
    """Get all diet plans created by the current practitioner"""
    current_user = get_jwt_identity()
    
    # Filter plans by current doctor
    plans = DietPlan.objects(createdBy=current_user).order_by('-lastModified')
    
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

@api_bp.route('/diet-plans/single/<plan_id>', methods=['GET'])
@jwt_required()
def get_single_diet_plan(plan_id):
    """Get a single diet plan by ID"""
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    patient = Patient.objects(patientId=plan.patientId).first()
    
    result = {
        "id": str(plan.id),
        "patientId": plan.patientId,
        "patientName": patient.name if patient else "Unknown",
        "generatedAt": plan.generatedAt.isoformat(),
        "lastModified": plan.lastModified.isoformat() if plan.lastModified else plan.generatedAt.isoformat(),
        "status": plan.status,
        "content": json.loads(plan.content) if plan.content else {},
        "publishedAt": plan.publishedAt.isoformat() if plan.publishedAt else None
    }
    return jsonify(result)

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
    """Publish a diet plan (Draft -> Active)"""
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    try:
        validate_status_transition(plan.status, 'active')
        plan.status = 'active'
        plan.publishedAt = get_ist_now()
        plan.lastModified = get_ist_now()
        plan.save()
        return jsonify({"message": "Diet plan published (active) successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@api_bp.route('/diet-plans/<plan_id>/complete', methods=['PUT'])
@jwt_required()
def complete_diet_plan(plan_id):
    """Mark a diet plan as completed (Active -> Completed)"""
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    try:
        validate_status_transition(plan.status, 'completed')
        plan.status = 'completed'
        plan.lastModified = get_ist_now()
        plan.save()
        return jsonify({"message": "Diet plan marked as completed"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@api_bp.route('/diet-plans/<plan_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_diet_plan(plan_id):
    """Cancel a diet plan (Draft/Active -> Cancelled)"""
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    try:
        validate_status_transition(plan.status, 'cancelled')
        plan.status = 'cancelled'
        plan.lastModified = get_ist_now()
        plan.save()
        return jsonify({"message": "Diet plan cancelled"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

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

@api_bp.route('/diet-plans/<plan_id>', methods=['DELETE'])
@jwt_required()
def delete_diet_plan(plan_id):
    """Delete a diet plan"""
    current_user = get_jwt_identity()
    
    plan = DietPlan.objects(id=plan_id).first()
    if not plan:
        return jsonify({"error": "Diet plan not found"}), 404
    
    # Only allow deletion by the doctor who created it
    if plan.createdBy != current_user:
        return jsonify({"error": "Unauthorized to delete this plan"}), 403
    
    plan.delete()
    return jsonify({"message": "Diet plan deleted successfully"}), 200

# Progress tracking endpoints
@api_bp.route('/progress', methods=['POST'])
@jwt_required()
def log_progress():
    from models import Progress
    from datetime import datetime, timedelta
    data = request.json
    current_user = get_jwt_identity()
    
    # Parse the date from request or use today
    date_str = data.get('date')
    if date_str:
        # Convert to datetime at start of day
        target_date = datetime.fromisoformat(date_str).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        target_date = get_ist_now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    patient_id = data.get('patientId', current_user)
    
    # Check for existing record on this date
    existing = Progress.objects(
        patientId=patient_id,
        date__gte=target_date,
        date__lt=target_date + timedelta(days=1)
    ).first()
    
    if existing:
        # Update existing record
        existing.waterIntake = data.get('waterIntake')
        existing.bowelMovement = data.get('bowelMovement')
        existing.symptoms = data.get('symptoms', '')
        existing.mealAdherence = data.get('mealAdherence')
        existing.weight = data.get('weight')
        existing.sleepHours = data.get('sleepHours')
        existing.mood = data.get('mood')
        existing.notes = data.get('notes', '')
        existing.save()
        return jsonify({"message": "Progress updated", "id": str(existing.id), "updated": True}), 200
    else:
        # Create new record
        progress = Progress(
            patientId=patient_id,
            date=target_date,
            waterIntake=data.get('waterIntake'),
            bowelMovement=data.get('bowelMovement'),
            symptoms=data.get('symptoms', ''),
            mealAdherence=data.get('mealAdherence'),
            weight=data.get('weight'),
            sleepHours=data.get('sleepHours'),
            mood=data.get('mood'),
            notes=data.get('notes', '')
        )
        progress.save()
        return jsonify({"message": "Progress logged", "id": str(progress.id), "updated": False}), 201

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
        "sleepHours": p.sleepHours,
        "mood": p.mood,
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


# Patient Profile Endpoints
@api_bp.route('/patient/profile', methods=['GET'])
@jwt_required()
def get_patient_profile():
    current_user_id = get_jwt_identity()
    patient = Patient.objects(patientId=current_user_id).first()
    
    if not patient:
        return jsonify({"error": "Patient profile not found"}), 404
    
    # Fetch email and name from User collection to ensure sync
    from models import User
    user = User.objects(uid=current_user_id).first()
    email = user.email if user else ""
    name = user.name if user else patient.name
        
    # Merge email/name into personalInfo for frontend convenience
    personal_info = patient.personalInfo or {}
    personal_info['email'] = email
    personal_info['name'] = name
    
    # Ensure address structure exists
    if 'address' not in personal_info:
        personal_info['address'] = {
            'line1': '', 'city': '', 'state': '', 'pincode': ''
        }
        
    return jsonify({
        "patientId": patient.patientId,
        "personalInfo": personal_info,
        "medicalInfo": patient.medicalInfo or {},
        "createdAt": patient.createdAt.isoformat() if patient.createdAt else None
    })

@api_bp.route('/patient/profile', methods=['PUT'])
@jwt_required()
def update_patient_profile():
    current_user_id = get_jwt_identity()
    data = request.json
    
    patient = Patient.objects(patientId=current_user_id).first()
    
    if not patient:
        return jsonify({"error": "Patient profile not found"}), 404
    
    # Update Personal Info
    if 'personalInfo' in data:
        # Prevent email update from here
        if 'email' in data['personalInfo']:
            del data['personalInfo']['email']
            
        patient.personalInfo = data['personalInfo']
        
        # Sync Name with User collection if changed
        if 'name' in data['personalInfo']:
            new_name = data['personalInfo']['name']
            patient.name = new_name
            
            from models import User
            user = User.objects(uid=current_user_id).first()
            if user:
                user.name = new_name
                user.save()
                
    # Update Medical Info
    if 'medicalInfo' in data:
        patient.medicalInfo = data['medicalInfo']
        
    patient.save()
    
    return jsonify({"message": "Profile updated successfully"}), 200


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
