from flask import Blueprint, request, jsonify
from models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'patient')
    
    if not email or not password or not name:
        return jsonify({"error": "Name, email and password required"}), 400
        
    if User.objects(email=email).first():
        return jsonify({"error": "User already exists"}), 400
    if role=="doctor":
        uid = f"DR-{uuid.uuid4().hex[:12].upper()}"
    elif role=="patient":
        uid = f"PT-{uuid.uuid4().hex[:12].upper()}"
    new_user = User(
        uid=uid,
        name=name,
        email=email,
        role=role,
        meta_info={ "verified": False}
    )
    new_user.set_password(password)
    new_user.save()
    
    # Create corresponding doctor/patient record if needed
    if role == 'doctor':
        from models import Doctor
        doctor = Doctor(
            doctorId=uid,
            name=name,
            specialization=data.get('specialization', ''),
        )
        doctor.save()
    elif role == 'patient':
        from models import Patient
        
        patient = Patient(
            patientId=uid,
            name=name
        )
        patient.save()
    
    # Auto-login: Generate token (7 days to match frontend cookie)
    access_token = create_access_token(identity=uid, expires_delta=timedelta(days=7))
    
    return jsonify({
        "message": "User registered successfully", 
        "uid": uid,
        "access_token": access_token,
        "name": name,
        "role": role
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # ---- ADMIN FIXED LOGIN ----
    if email and email.lower() == "ayurwell@gmail.com" and password == "ayurwell@100":
        access_token = create_access_token(
            identity="admin",
            additional_claims={"role": "admin"},
            expires_delta=timedelta(days=7)
        )
        return jsonify({
            "message": "Admin login success",
            "access_token": access_token,
            "uid": "admin",
            "name": "Admin",
            "email": "ayurwell@gmail.com",
            "role": "admin"
        }), 200
    
    # ---- NORMAL USER LOGIN ----
    user = User.objects(email=email).first()
    
    if user and user.check_password(password):
        access_token = create_access_token(
            identity=user.uid,
            additional_claims={"role": user.role},
            expires_delta=timedelta(days=7)
        )
        return jsonify({
            "access_token": access_token, 
            "uid": user.uid,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }), 200
        
    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information from JWT token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects(uid=current_user_id).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "uid": user.uid,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
