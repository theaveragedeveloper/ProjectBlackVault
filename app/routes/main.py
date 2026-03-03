from flask import Blueprint, render_template
from app.models import Firearm, Accessory, RoundLog, MaintenanceLog
from app import db
from datetime import datetime, timedelta

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    firearms = Firearm.query.order_by(Firearm.created_at.desc()).all()
    accessories = Accessory.query.order_by(Accessory.created_at.desc()).all()

    total_firearms = len(firearms)
    total_accessories = len(accessories)
    total_rounds = sum(f.total_rounds for f in firearms)
    total_value = sum((f.price_paid or 0) for f in firearms) + sum((a.price_paid or 0) for a in accessories)

    recent_rounds = (RoundLog.query
                     .order_by(RoundLog.date.desc(), RoundLog.created_at.desc())
                     .limit(5).all())

    recent_maintenance = (MaintenanceLog.query
                          .order_by(MaintenanceLog.date.desc(), MaintenanceLog.created_at.desc())
                          .limit(5).all())

    thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
    recent_round_count = (db.session.query(db.func.sum(RoundLog.rounds))
                          .filter(RoundLog.date >= thirty_days_ago)
                          .scalar() or 0)

    return render_template('index.html',
                           firearms=firearms,
                           total_firearms=total_firearms,
                           total_accessories=total_accessories,
                           total_rounds=total_rounds,
                           total_value=total_value,
                           recent_rounds=recent_rounds,
                           recent_maintenance=recent_maintenance,
                           recent_round_count=recent_round_count)
