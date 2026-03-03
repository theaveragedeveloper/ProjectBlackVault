from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash
from app import db
from app.models import MaintenanceLog, Firearm, Accessory, MAINTENANCE_TYPES

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/maintenance')


@maintenance_bp.route('/')
def list_maintenance():
    logs = (MaintenanceLog.query
            .order_by(MaintenanceLog.date.desc(), MaintenanceLog.created_at.desc())
            .all())
    return render_template('maintenance/list.html', logs=logs, maintenance_types=MAINTENANCE_TYPES)


@maintenance_bp.route('/add', methods=['GET', 'POST'])
def add_maintenance():
    firearms = Firearm.query.order_by(Firearm.name).all()
    accessories = Accessory.query.order_by(Accessory.name).all()

    if request.method == 'POST':
        log_date = datetime.utcnow().date()
        if request.form.get('date'):
            try:
                log_date = datetime.strptime(request.form['date'], '%Y-%m-%d').date()
            except ValueError:
                pass

        next_service = None
        if request.form.get('next_service_date'):
            try:
                next_service = datetime.strptime(request.form['next_service_date'], '%Y-%m-%d').date()
            except ValueError:
                pass

        cost = None
        if request.form.get('cost'):
            try:
                cost = float(request.form['cost'])
            except ValueError:
                pass

        firearm_id = request.form.get('firearm_id') or None
        accessory_id = request.form.get('accessory_id') or None

        if firearm_id:
            firearm_id = int(firearm_id)
        if accessory_id:
            accessory_id = int(accessory_id)

        maintenance_type = request.form.get('maintenance_type', '').strip()

        if maintenance_type == 'battery_change' and accessory_id:
            accessory = Accessory.query.get(accessory_id)
            if accessory:
                accessory.last_battery_change = log_date

        log = MaintenanceLog(
            firearm_id=firearm_id,
            accessory_id=accessory_id,
            maintenance_type=maintenance_type or None,
            date=log_date,
            cost=cost,
            notes=request.form.get('notes', '').strip() or None,
            next_service_date=next_service,
        )
        db.session.add(log)
        db.session.commit()
        flash('Maintenance record logged.', 'success')
        return redirect(url_for('maintenance.list_maintenance'))

    prefill_firearm = request.args.get('firearm_id')
    prefill_accessory = request.args.get('accessory_id')

    return render_template('maintenance/form.html',
                           firearms=firearms,
                           accessories=accessories,
                           maintenance_types=MAINTENANCE_TYPES,
                           prefill_firearm=prefill_firearm,
                           prefill_accessory=prefill_accessory)


@maintenance_bp.route('/<int:log_id>/delete', methods=['POST'])
def delete_maintenance(log_id):
    log = MaintenanceLog.query.get_or_404(log_id)
    db.session.delete(log)
    db.session.commit()
    flash('Maintenance record deleted.', 'success')
    return redirect(url_for('maintenance.list_maintenance'))
