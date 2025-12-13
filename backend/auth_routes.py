from flask import Blueprint, request, jsonify
from models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from otp_service import otp_service
from email_service import email_service
import uuid
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user and send OTP for email verification"""
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'patient')
    
    if not email or not password or not name:
        return jsonify({"error": "Name, email and password required"}), 400
        
    if User.objects(email=email).first():
        return jsonify({"error": "User already exists"}), 400
    
    # Generate UID based on role
    if role == "doctor":
        uid = f"DR-{uuid.uuid4().hex[:12].upper()}"
    elif role == "patient":
        uid = f"PT-{uuid.uuid4().hex[:12].upper()}"
    else:
        return jsonify({"error": "Invalid role specified"}), 400
    
    # Create user with emailVerified=False
    new_user = User(
        uid=uid,
        name=name,
        email=email,
        role=role,
        emailVerified=False,  # Email not verified yet
        meta_info={"verified": False}
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
    
    # Send OTP for email verification
    otp_result = otp_service.send_otp(email, 'signup')
    
    if not otp_result['success']:
        # If OTP sending fails, still return success but with a warning
        return jsonify({
            "message": "User registered successfully, but failed to send verification email. Please use resend OTP.",
            "email": email,
            "requiresVerification": True
        }), 201
    
    return jsonify({
        "message": "Registration successful! Please check your email for verification code.",
        "email": email,
        "requiresVerification": True,
        "expiresIn": otp_result.get('expiresIn', 5)
    }), 201

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email with OTP for signup"""
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({"error": "Email and OTP required"}), 400
    
    # Verify OTP
    result = otp_service.verify_otp(email, otp, 'signup')
    
    if not result['success']:
        return jsonify({"error": result['message']}), 400
    
    # Mark user as verified
    user = User.objects(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user.emailVerified = True
    user.meta_info['verified'] = True
    user.save()

    # Auto-login: Generate token (7 days to match frontend cookie)
    access_token = create_access_token(identity=user.uid, expires_delta=timedelta(days=7))
    
    return jsonify({
        "message": "Email verified successfully!",
        "email": email,
        "uid": user.uid,
        "access_token": access_token,
        "name": user.name,
        "role": user.role
    }), 200

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP for email verification"""
    data = request.json
    email = data.get('email')
    purpose = data.get('purpose', 'signup')  # 'signup' or 'email_change'
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    # For signup, check if user exists and is not verified
    if purpose == 'signup':
        user = User.objects(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user.emailVerified:
            return jsonify({"error": "Email already verified"}), 400
    
    # Send new OTP
    result = otp_service.send_otp(email, purpose)
    
    if not result['success']:
        return jsonify({"error": result['message']}), 500
    
    return jsonify({
        "message": result['message'],
        "expiresIn": result.get('expiresIn', 5)
    }), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # ---- ADMIN FIXED LOGIN ----
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if email and email.lower() == admin_email.lower() and password == admin_password:
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
            "email": admin_email,
            "role": "admin"
        }), 200
    
    # ---- NORMAL USER LOGIN ----
    user = User.objects(email=email).first()
    
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    if not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check if email is verified
    if not user.emailVerified:
        return jsonify({
            "error": "Email not verified. Please verify your email before logging in.",
            "requiresVerification": True,
            "email": user.email
        }), 403
    
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

@auth_bp.route('/request-email-change', methods=['POST'])
@jwt_required()
def request_email_change():
    """Request to change email address"""
    current_user_id = get_jwt_identity()
    user = User.objects(uid=current_user_id).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    new_email = data.get('newEmail')
    
    if not new_email:
        return jsonify({"error": "New email required"}), 400
    
    # Check if new email is already in use
    if User.objects(email=new_email).first():
        return jsonify({"error": "Email already in use"}), 400
    
    # Store pending email
    user.pendingEmail = new_email
    user.save()
    
    # Send OTP to new email
    result = otp_service.send_otp(new_email, 'email_change', user_id=current_user_id)
    
    if not result['success']:
        return jsonify({"error": result['message']}), 500
    
    return jsonify({
        "message": f"Verification code sent to {new_email}",
        "expiresIn": result.get('expiresIn', 5)
    }), 200

@auth_bp.route('/verify-email-change', methods=['POST'])
@jwt_required()
def verify_email_change():
    """Verify email change with OTP"""
    current_user_id = get_jwt_identity()
    user = User.objects(uid=current_user_id).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.pendingEmail:
        return jsonify({"error": "No pending email change request"}), 400
    
    data = request.json
    otp = data.get('otp')
    
    if not otp:
        return jsonify({"error": "OTP required"}), 400
    
    # Verify OTP
    result = otp_service.verify_otp(user.pendingEmail, otp, 'email_change')
    
    if not result['success']:
        return jsonify({"error": result['message']}), 400
    
    # Store old email for notification
    old_email = user.email
    
    # Update email
    user.email = user.pendingEmail
    user.pendingEmail = None
    user.save()
    
    # Send notification to old email
    email_service.send_email_changed_notification(old_email, user.name)
    
    return jsonify({
        "message": "Email changed successfully",
        "newEmail": user.email
    }), 200

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
            "role": user.role,
            "emailVerified": user.emailVerified,
            "pendingEmail": user.pendingEmail
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
