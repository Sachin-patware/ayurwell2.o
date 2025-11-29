from flask import Flask
from flask_cors import CORS
from models import db
from routes import api_bp
from dotenv import load_dotenv
 
from flask_jwt_extended import JWTManager
from auth_routes import auth_bp

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['MONGODB_SETTINGS'] = {
        'host': 'mongodb://localhost:27017/ayurwell'
    }
    app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this-in-prod'
    
    # Configure CORS to allow requests from frontend
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    db.init_app(app)
    jwt = JWTManager(app)
    
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from extra_routes import appt_bp
    app.register_blueprint(appt_bp, url_prefix='/api/appointments')
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=True)
