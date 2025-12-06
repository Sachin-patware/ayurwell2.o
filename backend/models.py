from flask_mongoengine import MongoEngine
from datetime import datetime, timedelta, timezone

db = MongoEngine()

# IST Timezone utility (UTC+5:30)
def get_ist_now():
    """Get current time in Indian Standard Time (IST)"""
    ist_offset = timedelta(hours=5, minutes=30)
    ist_tz = timezone(ist_offset)
    return datetime.now(ist_tz)

class User(db.Document):
    uid = db.StringField(required=True, unique=True)
    name = db.StringField(max_length=100, required=True)
    email = db.StringField(max_length=120, required=True, unique=True)
    password = db.StringField(max_length=120, required=True)
    role = db.StringField(max_length=20, default='patient', choices=['patient', 'doctor', 'admin'])
    createdAt = db.DateTimeField(default=get_ist_now)
    meta_info = db.DictField(default={})  # phone, verified, etc.

    def set_password(self, password):
        from flask_bcrypt import generate_password_hash
        self.password = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        from flask_bcrypt import check_password_hash
        return check_password_hash(self.password, password)

class Doctor(db.Document):
    doctorId = db.StringField(required=True, unique=True)
    name = db.StringField(max_length=100, required=True)
    specialization = db.StringField(max_length=100)
    clinicHours = db.ListField(db.DictField())  # [{day, from, to}]
    # Rich Profile Fields
    personalInfo = db.DictField(default={})
    professionalInfo = db.DictField(default={})
    clinicInfo = db.DictField(default={})
    account = db.DictField(default={})
    createdAt = db.DateTimeField(default=get_ist_now)

class Patient(db.Document):
    patientId = db.StringField(required=True, unique=True)
    name = db.StringField(max_length=100, required=True)
    assignedDoctorId = db.StringField()
    healthHistory = db.StringField()
    assessment = db.DictField(default={})  # prakriti, vikriti, age, etc.
    assessmentCreatedBy = db.StringField()  # doctorId
    assessmentCreatedAt = db.DateTimeField()
    
    # New Profile Fields
    personalInfo = db.DictField(default={})  # gender, age, email, phone, address
    medicalInfo = db.DictField(default={})   # bloodGroup, dietPreferences, smoking, alcohol
    
    createdAt = db.DateTimeField(default=get_ist_now)

class Assessment(db.Document):
    """Separate collection for patient assessments with full history"""
    assessmentId = db.StringField(required=True, unique=True)
    patientId = db.StringField(required=True)
    doctorId = db.StringField(required=True)
    createdAt = db.DateTimeField(default=get_ist_now)
    
    # Assessment data
    assessment = db.DictField(default={})  # {age, gender, prakriti, vikriti}
    healthHistory = db.StringField()
    medicalConditions = db.StringField()
    lifestyle = db.StringField()
    dietaryHabits = db.StringField()
    symptoms = db.StringField()
    notes = db.StringField()
    
    # Metadata
    updatedAt = db.DateTimeField(default=get_ist_now)
    
    # Indexes for efficient querying
    meta = {
        'indexes': [
            {'fields': ['patientId', '-createdAt']},  # Patient's assessments, newest first
            {'fields': ['doctorId', '-createdAt']},   # Doctor's assessments, newest first
            {'fields': ['assessmentId']},
        ]
    }


class Appointment(db.Document):
    doctorId = db.StringField(required=True)
    patientId = db.StringField(required=True)
    patientName = db.StringField(required=True)
    doctorName = db.StringField(required=True)
    startTimestamp = db.DateTimeField(required=True)
    endTimestamp = db.DateTimeField()
    status = db.StringField(
        default='pending', 
        choices=['pending', 'confirmed', 'cancelled', 'doctor_rescheduled_pending', 'patient_rescheduled_pending', 'completed']
    )
    notes = db.StringField()
    cancelReason = db.StringField()
    rescheduleReason = db.StringField()  # Reason for rescheduling
    isRescheduledBy = db.StringField(choices=['patient', 'doctor', None])
    proposedStartTimestamp = db.DateTimeField()  # For doctor-initiated reschedules
    proposedEndTimestamp = db.DateTimeField()    # For doctor-initiated reschedules
    createdAt = db.DateTimeField(default=get_ist_now)
    updatedAt = db.DateTimeField(default=get_ist_now)
    
    # Indexes for performance
    meta = {
        'indexes': [
            {'fields': ['doctorId', 'startTimestamp']},
            {'fields': ['patientId', 'startTimestamp']},
            {'fields': ['status', 'startTimestamp']},
            {'fields': ['doctorId', 'status', 'startTimestamp']}
        ]
    }

class DietPlan(db.Document):
    patientId = db.StringField(required=True)
    generatedAt = db.DateTimeField(default=get_ist_now)
    content = db.StringField()  # JSON string of the plan
    createdBy = db.StringField()  # doctorId
    status = db.StringField(default='draft', choices=['draft', 'active', 'completed', 'cancelled'])
    publishedAt = db.DateTimeField()  # When it was activated/published
    lastModified = db.DateTimeField(default=get_ist_now)

    meta = {'strict': False}




class Food(db.Document):
    name = db.StringField(required=True)
    rasa = db.StringField()  # taste
    virya = db.StringField()  # potency
    vipaka = db.StringField()  # post-digestive effect
    dosha_effect = db.DictField()  # {vata: +1, pitta: -1, kapha: 0}
    calories = db.IntField()
    nutrients = db.DictField()
    seasonal = db.BooleanField(default=False)
    tags = db.ListField(db.StringField())

class Progress(db.Document):
    patientId = db.StringField(required=True)
    date = db.DateTimeField(default=get_ist_now)
    waterIntake = db.IntField()  # in ml
    bowelMovement = db.StringField()  # e.g., "normal", "loose", "constipated"
    symptoms = db.StringField()
    mealAdherence = db.IntField()  # percentage
    weight = db.FloatField()  # optional
    sleepHours = db.FloatField()  # New: Sleep duration
    mood = db.StringField()  # New: Mood (e.g., "Happy", "Stressed")
    notes = db.StringField()

