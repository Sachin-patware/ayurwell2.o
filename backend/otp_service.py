"""
OTP Service for Email Verification
Handles OTP generation, validation, and email sending
"""
import random
import string
from datetime import datetime, timedelta, timezone
from flask_bcrypt import generate_password_hash, check_password_hash
from models import OTPVerification, get_ist_now
from email_service import email_service


class OTPService:
    """Service for managing OTP verification"""
    
    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 5
    MAX_ATTEMPTS = 3
    
    @staticmethod
    def generate_otp():
        """Generate a random 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=OTPService.OTP_LENGTH))
    
    @staticmethod
    def send_otp(email, purpose, user_id=None):
        """
        Generate and send OTP to email
        
        Args:
            email: Email address to send OTP to
            purpose: 'signup' or 'email_change'
            user_id: User ID (required for email_change)
            
        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            # Invalidate any existing unverified OTPs for this email and purpose
            OTPVerification.objects(
                email=email, 
                purpose=purpose, 
                verified=False
            ).delete()
            
            # Generate new OTP
            otp_code = OTPService.generate_otp()
            hashed_otp = generate_password_hash(otp_code).decode('utf-8')
            
            # Calculate expiration time
            expires_at = get_ist_now() + timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES)
            
            # Create OTP record
            otp_record = OTPVerification(
                email=email,
                otp=hashed_otp,
                purpose=purpose,
                expiresAt=expires_at,
                userId=user_id
            )
            otp_record.save()
            
            # Send email
            email_service.send_otp_email(email, otp_code, purpose)
            
            return {
                'success': True,
                'message': f'OTP sent to {email}',
                'expiresIn': OTPService.OTP_EXPIRY_MINUTES
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to send OTP: {str(e)}'
            }
    
    @staticmethod
    def verify_otp(email, otp_code, purpose):
        """
        Verify OTP code
        
        Args:
            email: Email address
            otp_code: OTP code to verify
            purpose: 'signup' or 'email_change'
            
        Returns:
            dict: {'success': bool, 'message': str, 'userId': str (optional)}
        """
        try:
            # Find the most recent unverified OTP for this email and purpose
            otp_record = OTPVerification.objects(
                email=email,
                purpose=purpose,
                verified=False
            ).order_by('-createdAt').first()
            
            if not otp_record:
                return {
                    'success': False,
                    'message': 'No OTP found. Please request a new one.'
                }
            
            # Check if OTP has expired
            # Handle timezone awareness (Mongo stores as UTC naive usually)
            current_time = get_ist_now()
            expires_at = otp_record.expiresAt
            
            # If expires_at is naive, assume UTC and make it aware
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
                
            if current_time > expires_at:
                return {
                    'success': False,
                    'message': 'OTP has expired. Please request a new one.'
                }
            
            # Check if max attempts exceeded
            if otp_record.attempts >= OTPService.MAX_ATTEMPTS:
                return {
                    'success': False,
                    'message': 'Maximum verification attempts exceeded. Please request a new OTP.'
                }
            
            # Increment attempts
            otp_record.attempts += 1
            otp_record.save()
            
            # Verify OTP
            if not check_password_hash(otp_record.otp, otp_code):
                remaining_attempts = OTPService.MAX_ATTEMPTS - otp_record.attempts
                if remaining_attempts > 0:
                    return {
                        'success': False,
                        'message': f'Invalid OTP. {remaining_attempts} attempt(s) remaining.'
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.'
                    }
            
            # Mark as verified
            otp_record.verified = True
            otp_record.save()
            
            result = {
                'success': True,
                'message': 'Email verified successfully'
            }
            
            # Include userId for email_change purpose
            if purpose == 'email_change' and otp_record.userId:
                result['userId'] = otp_record.userId
            
            return result
            
        except Exception as e:
            print(f"OTP Verification Error: {e}") # Add logging
            return {
                'success': False,
                'message': f'Verification failed: {str(e)}'
            }
    
    @staticmethod
    def cleanup_expired():
        """Remove expired OTP records (called periodically if needed)"""
        try:
            # For cleanup query, strictly speaking we need to match DB time logic
            # But here naive comparison might work if we just generate a naive UTC time?
            # Or use IST if that's what we compare with...
            # Actually simplest is just to not use naive comparison in the query if possible, 
            # OR pass a datetime that matches what DB expects. 
            # If DB stores naive UTC, we pass naive UTC.
            
            now_utc = datetime.now(timezone.utc)
            # If using naive datetime in query for naive field, convert to naive UTC
            now_utc_naive = now_utc.replace(tzinfo=None)

            expired_count = OTPVerification.objects(
                expiresAt__lt=now_utc_naive 
            ).delete()
            return {
                'success': True,
                'message': f'Cleaned up {expired_count} expired OTP records'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}'
            }


# Global OTP service instance
otp_service = OTPService()
