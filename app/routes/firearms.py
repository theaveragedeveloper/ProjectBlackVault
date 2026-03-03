import os
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from werkzeug.utils import secure_filename
from app import db
from app.models import Firearm, RoundLog, Build, BuildSlot

firearms_bp = Blueprint('firearms', __name__, url_prefix='/firearms')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

FIREARM_TYPES = [
    ('rifle', 'Rifle'),
    ('pistol', 'Pistol'),
    ('shotgun', 'Shotgun'),
    ('smg', 'SMG / PDW'),
    ('lmg', 'LMG / Machine Gun'),
    ('sniper', 'Sniper Rifle'),
    ('other', 'Other'),
]


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_image(file, subfolder):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        upload_path = os.path.join(current_app.root_path, 'static', 'uploads', subfolder)
        os.makedirs(upload_path, exist_ok=True)
        file.save(os.path.join(upload_path, filename))
        return f'uploads/{subfolder}/{filename}'
    return None


@firearms_bp.route('/')
def list_firearms():
    firearms = Firearm.query.order_by(Firearm.created_at.desc()).all()
    return render_template('firearms/list.html', firearms=firearms)


@firearms_bp.route('/add', methods=['GET', 'POST'])
def add_firearm():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Firearm name is required.', 'error')
            return render_template('firearms/form.html', firearm=None, firearm_types=FIREARM_TYPES)

        image_path = None
        if 'image' in request.files:
            image_path = save_image(request.files['image'], 'firearms')

        date_acquired = None
        if request.form.get('date_acquired'):
            try:
                date_acquired = datetime.strptime(request.form['date_acquired'], '%Y-%m-%d').date()
            except ValueError:
                pass

        price = None
        if request.form.get('price_paid'):
            try:
                price = float(request.form['price_paid'])
            except ValueError:
                pass

        firearm = Firearm(
            name=name,
            make=request.form.get('make', '').strip() or None,
            model=request.form.get('model', '').strip() or None,
            caliber=request.form.get('caliber', '').strip() or None,
            firearm_type=request.form.get('firearm_type') or None,
            serial_number=request.form.get('serial_number', '').strip() or None,
            date_acquired=date_acquired,
            price_paid=price,
            image_path=image_path,
            notes=request.form.get('notes', '').strip() or None,
        )
        db.session.add(firearm)
        db.session.commit()
        flash(f'"{firearm.name}" added to the vault.', 'success')
        return redirect(url_for('firearms.firearm_detail', firearm_id=firearm.id))

    return render_template('firearms/form.html', firearm=None, firearm_types=FIREARM_TYPES)


@firearms_bp.route('/<int:firearm_id>')
def firearm_detail(firearm_id):
    firearm = Firearm.query.get_or_404(firearm_id)
    round_logs = (RoundLog.query
                  .filter_by(firearm_id=firearm_id)
                  .order_by(RoundLog.date.desc())
                  .all())
    return render_template('firearms/detail.html',
                           firearm=firearm,
                           round_logs=round_logs,
                           firearm_types=FIREARM_TYPES)


@firearms_bp.route('/<int:firearm_id>/edit', methods=['GET', 'POST'])
def edit_firearm(firearm_id):
    firearm = Firearm.query.get_or_404(firearm_id)

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Firearm name is required.', 'error')
            return render_template('firearms/form.html', firearm=firearm, firearm_types=FIREARM_TYPES)

        if 'image' in request.files and request.files['image'].filename:
            image_path = save_image(request.files['image'], 'firearms')
            if image_path:
                firearm.image_path = image_path

        date_acquired = None
        if request.form.get('date_acquired'):
            try:
                date_acquired = datetime.strptime(request.form['date_acquired'], '%Y-%m-%d').date()
            except ValueError:
                pass

        price = None
        if request.form.get('price_paid'):
            try:
                price = float(request.form['price_paid'])
            except ValueError:
                pass

        firearm.name = name
        firearm.make = request.form.get('make', '').strip() or None
        firearm.model = request.form.get('model', '').strip() or None
        firearm.caliber = request.form.get('caliber', '').strip() or None
        firearm.firearm_type = request.form.get('firearm_type') or None
        firearm.serial_number = request.form.get('serial_number', '').strip() or None
        firearm.date_acquired = date_acquired
        firearm.price_paid = price
        firearm.notes = request.form.get('notes', '').strip() or None
        firearm.updated_at = datetime.utcnow()

        db.session.commit()
        flash(f'"{firearm.name}" updated.', 'success')
        return redirect(url_for('firearms.firearm_detail', firearm_id=firearm.id))

    return render_template('firearms/form.html', firearm=firearm, firearm_types=FIREARM_TYPES)


@firearms_bp.route('/<int:firearm_id>/delete', methods=['POST'])
def delete_firearm(firearm_id):
    firearm = Firearm.query.get_or_404(firearm_id)
    name = firearm.name
    db.session.delete(firearm)
    db.session.commit()
    flash(f'"{name}" removed from the vault.', 'success')
    return redirect(url_for('firearms.list_firearms'))


@firearms_bp.route('/<int:firearm_id>/log-rounds', methods=['POST'])
def log_rounds(firearm_id):
    firearm = Firearm.query.get_or_404(firearm_id)

    try:
        rounds = int(request.form.get('rounds', 0))
    except ValueError:
        rounds = 0

    if rounds <= 0:
        flash('Please enter a valid round count.', 'error')
        return redirect(url_for('firearms.firearm_detail', firearm_id=firearm_id))

    log_date = datetime.utcnow().date()
    if request.form.get('date'):
        try:
            log_date = datetime.strptime(request.form['date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    active_build = firearm.active_build
    build_id = active_build.id if active_build else None

    round_log = RoundLog(
        firearm_id=firearm_id,
        build_id=build_id,
        rounds=rounds,
        date=log_date,
        ammo_type=request.form.get('ammo_type', '').strip() or None,
        notes=request.form.get('notes', '').strip() or None,
    )
    db.session.add(round_log)

    if active_build:
        for slot in active_build.slots:
            if slot.accessory_id and slot.accessory:
                slot.accessory.total_rounds = (slot.accessory.total_rounds or 0) + rounds

    db.session.commit()
    flash(f'{rounds:,} rounds logged on {firearm.name}.', 'success')
    return redirect(url_for('firearms.firearm_detail', firearm_id=firearm_id))
