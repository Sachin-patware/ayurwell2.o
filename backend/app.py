from flask import Flask
from flask_cors import CORS
from models import db
from routes import api_bp

from flask_jwt_extended import JWTManager
from auth_routes import auth_bp

def create_app():
    app = Flask(__name__)
    app.config['MONGODB_SETTINGS'] = {
        'host': 'mongodb://localhost:27017/ayurwell'
    }
    app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this-in-prod'
    
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from extra_routes import appt_bp
    app.register_blueprint(appt_bp, url_prefix='/api/appointments')
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
