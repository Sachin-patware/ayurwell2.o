from app import create_app
from models import User, Patient, Doctor, Appointment, DietPlan, Progress
from datetime import datetime, timedelta
            email='dr_ayur@example.com',
            name='Dr. Ayur',
            role='doctor',
            meta_info={"verified": True}
        )
        doc1.set_password('password123')
        doc1.save()

        doc1_profile = Doctor(
            doctorId=doc1_uid,
            name="Dr. Ayur",
            specialization="Ayurvedic Dietetics",
            clinicHours=[
                {"day": "Monday", "from": "09:00", "to": "17:00"},
                {"day": "Wednesday", "from": "09:00", "to": "17:00"},
                {"day": "Friday", "from": "09:00", "to": "13:00"}
            ],
            status="verified"
        )
        doc1_profile.save()
        print("Created Doctor: Dr. Ayur")

        # Doctor 2
        doc2_uid = str(uuid.uuid4())
        doc2 = User(
            uid=doc2_uid,
            email='dr_wellness@example.com',
            name='Dr. Wellness',
            role='doctor',
            meta_info={"verified": True}
        )
        doc2.set_password('password123')
        doc2.save()

        doc2_profile = Doctor(
            doctorId=doc2_uid,
            name="Dr. Wellness",
            specialization="General Wellness",
            clinicHours=[
                {"day": "Tuesday", "from": "10:00", "to": "18:00"},
                {"day": "Thursday", "from": "10:00", "to": "18:00"}
            ],
            status="verified"
        )
        doc2_profile.save()
        print("Created Doctor: Dr. Wellness")

        # Doctor 3
        doc3_uid = str(uuid.uuid4())
        doc3 = User(
            uid=doc3_uid,
            email='dr_prakash@example.com',
            name='Dr. Prakash',
            role='doctor',
            meta_info={"verified": True}
        )
        doc3.set_password('password123')
        doc3.save()

        doc3_profile = Doctor(
            doctorId=doc3_uid,
            name="Dr. Prakash",
            specialization="Panchakarma Specialist",
            clinicHours=[
                {"day": "Monday", "from": "14:00", "to": "20:00"},
                {"day": "Wednesday", "from": "14:00", "to": "20:00"},
                {"day": "Saturday", "from": "09:00", "to": "15:00"}
            ],
            status="verified"
        )
        doc3_profile.save()
        print("Created Doctor: Dr. Prakash")

        # 2. Create Patient
        pat_uid = str(uuid.uuid4())
        pat = User(
            uid=pat_uid,
            email='john@example.com',
            name='John Doe',
            role='patient',
            meta_info={"verified": True}
        )
        print("Seeding complete!")

if __name__ == '__main__':
    seed_data()
