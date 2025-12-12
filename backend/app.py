from flask import Flask
from flask_cors import CORS
from models import db
from routes import api_bp
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager
from auth_routes import auth_bp

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['MONGODB_SETTINGS'] = {
        'host':os.getenv("MONGODB_URI")
    }
    app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
    
    # Configure CORS for production and development
    # Allow all origins for maximum compatibility
    CORS(app, 
         origins="*",
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept"],
         supports_credentials=True,
         expose_headers=["Content-Type", "Authorization"]
    )
    db.init_app(app)
    jwt = JWTManager(app)
    
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from extra_routes import appt_bp
    app.register_blueprint(appt_bp, url_prefix='/api/appointments')
    
    from admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
        
    return app

app = create_app()
if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=True)
