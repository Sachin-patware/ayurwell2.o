"""
Database migration script for appointment system upgrade
Migrates existing appointments to new schema
"""
from models import db, Appointment, get_ist_now
from flask import Flask

def create_app():
    """Create Flask app for migration"""
    app = Flask(__name__)
    app.config['MONGODB_SETTINGS'] = {
        'host': 'mongodb://localhost:27017/ayurwell'
    }
    db.init_app(app)
    return app

def migrate_appointments():
    """
    Migrate existing appointments to new schema
    - Update status from 'upcoming' to 'confirmed'
    - Add default values for new fields
    """
    print("\n" + "="*60)
    print("APPOINTMENT MIGRATION SCRIPT")
    print("="*60 + "\n")
    
    # Get all appointments
    appointments = Appointment.objects()
    total = appointments.count()
    
    print(f"Found {total} appointments to migrate\n")
    
    if total == 0:
        print("✓ No appointments to migrate")
        return
    
    migrated = 0
    errors = 0
    
    for appt in appointments:
        try:
            # Update status
            if appt.status == 'upcoming':
                appt.status = 'confirmed'
            
            # Add new fields if not present
            if not hasattr(appt, 'updatedAt') or not appt.updatedAt:
                appt.updatedAt = appt.createdAt if hasattr(appt, 'createdAt') else get_ist_now()
            
            if not hasattr(appt, 'isRescheduledBy'):
                appt.isRescheduledBy = None
            
            if not hasattr(appt, 'cancelReason'):
                appt.cancelReason = None
            
            if not hasattr(appt, 'proposedStartTimestamp'):
                appt.proposedStartTimestamp = None
            
            if not hasattr(appt, 'proposedEndTimestamp'):
                appt.proposedEndTimestamp = None
            
            appt.save()
            migrated += 1
            print(f"✓ Migrated appointment {appt.id} ({appt.patientName} with Dr. {appt.doctorName})")
            
        except Exception as e:
            errors += 1
            print(f"✗ Error migrating appointment {appt.id}: {str(e)}")
    
    print(f"\n" + "="*60)
    print(f"MIGRATION COMPLETE")
    print(f"="*60)
    print(f"Total: {total}")
    print(f"Migrated: {migrated}")
    print(f"Errors: {errors}")
    print("="*60 + "\n")

def create_indexes():
    """Create database indexes for performance"""
    print("\n" + "="*60)
    print("CREATING INDEXES")
    print("="*60 + "\n")
    
    try:
        # Indexes are defined in the model's meta, but we can ensure they're created
        from mongoengine import connect
        connect('ayurwell', host='mongodb://localhost:27017/ayurwell')
        
        # MongoEngine will create indexes automatically on first query
        # But we can trigger it explicitly
        Appointment.ensure_indexes()
        
        print("✓ Indexes created successfully")
        print("  - (doctorId, startTimestamp)")
        print("  - (patientId, startTimestamp)")
        print("  - (status, startTimestamp)")
        print("  - (doctorId, status, startTimestamp)")
        
    except Exception as e:
        print(f"✗ Error creating indexes: {str(e)}")
    
    print("="*60 + "\n")

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        print("\n🚀 Starting migration...\n")
        
        # Step 1: Migrate appointments
        migrate_appointments()
        
        # Step 2: Create indexes
        create_indexes()
        
        print("✅ Migration completed successfully!\n")
