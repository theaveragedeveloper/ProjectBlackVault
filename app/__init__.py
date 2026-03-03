import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///blackvault.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'app/static/uploads')
    app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

    db.init_app(app)

    from app.routes.main import main_bp
    from app.routes.firearms import firearms_bp
    from app.routes.accessories import accessories_bp
    from app.routes.builds import builds_bp
    from app.routes.maintenance import maintenance_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(firearms_bp)
    app.register_blueprint(accessories_bp)
    app.register_blueprint(builds_bp)
    app.register_blueprint(maintenance_bp)

    from datetime import datetime

    @app.template_global()
    def now():
        return datetime.utcnow()

    with app.app_context():
        db.create_all()

    return app
