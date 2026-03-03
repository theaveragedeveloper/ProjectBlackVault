import os
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from werkzeug.utils import secure_filename
from app import db
from app.models import Accessory, ACCESSORY_CATEGORIES

accessories_bp = Blueprint('accessories', __name__, url_prefix='/accessories')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


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


@accessories_bp.route('/')
def list_accessories():
    category = request.args.get('category')
    query = Accessory.query
    if category:
        query = query.filter_by(category=category)
    accessories = query.order_by(Accessory.created_at.desc()).all()
    return render_template('accessories/list.html',
                           accessories=accessories,
                           categories=ACCESSORY_CATEGORIES,
                           active_category=category)


@accessories_bp.route('/add', methods=['GET', 'POST'])
def add_accessory():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Accessory name is required.', 'error')
            return render_template('accessories/form.html', accessory=None, categories=ACCESSORY_CATEGORIES)

        image_path = None
        if 'image' in request.files:
            image_path = save_image(request.files['image'], 'accessories')

        date_acquired = None
        if request.form.get('date_acquired'):
            try:
                date_acquired = datetime.strptime(request.form['date_acquired'], '%Y-%m-%d').date()
            except ValueError:
                pass

        last_battery = None
        if request.form.get('last_battery_change'):
            try:
                last_battery = datetime.strptime(request.form['last_battery_change'], '%Y-%m-%d').date()
            except ValueError:
                pass

        price = None
        if request.form.get('price_paid'):
            try:
                price = float(request.form['price_paid'])
            except ValueError:
                pass

        accessory = Accessory(
            name=name,
            category=request.form.get('category') or None,
            make=request.form.get('make', '').strip() or None,
            model=request.form.get('model', '').strip() or None,
            serial_number=request.form.get('serial_number', '').strip() or None,
            date_acquired=date_acquired,
            price_paid=price,
            last_battery_change=last_battery,
            image_path=image_path,
            notes=request.form.get('notes', '').strip() or None,
        )
        db.session.add(accessory)
        db.session.commit()
        flash(f'"{accessory.name}" added to the vault.', 'success')
        return redirect(url_for('accessories.accessory_detail', accessory_id=accessory.id))

    return render_template('accessories/form.html', accessory=None, categories=ACCESSORY_CATEGORIES)


@accessories_bp.route('/<int:accessory_id>')
def accessory_detail(accessory_id):
    accessory = Accessory.query.get_or_404(accessory_id)
    return render_template('accessories/detail.html', accessory=accessory)


@accessories_bp.route('/<int:accessory_id>/edit', methods=['GET', 'POST'])
def edit_accessory(accessory_id):
    accessory = Accessory.query.get_or_404(accessory_id)

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Accessory name is required.', 'error')
            return render_template('accessories/form.html', accessory=accessory, categories=ACCESSORY_CATEGORIES)

        if 'image' in request.files and request.files['image'].filename:
            image_path = save_image(request.files['image'], 'accessories')
            if image_path:
                accessory.image_path = image_path

        date_acquired = None
        if request.form.get('date_acquired'):
            try:
                date_acquired = datetime.strptime(request.form['date_acquired'], '%Y-%m-%d').date()
            except ValueError:
                pass

        last_battery = None
        if request.form.get('last_battery_change'):
            try:
                last_battery = datetime.strptime(request.form['last_battery_change'], '%Y-%m-%d').date()
            except ValueError:
                pass

        price = None
        if request.form.get('price_paid'):
            try:
                price = float(request.form['price_paid'])
            except ValueError:
                pass

        accessory.name = name
        accessory.category = request.form.get('category') or None
        accessory.make = request.form.get('make', '').strip() or None
        accessory.model = request.form.get('model', '').strip() or None
        accessory.serial_number = request.form.get('serial_number', '').strip() or None
        accessory.date_acquired = date_acquired
        accessory.price_paid = price
        accessory.last_battery_change = last_battery
        accessory.notes = request.form.get('notes', '').strip() or None
        accessory.updated_at = datetime.utcnow()

        db.session.commit()
        flash(f'"{accessory.name}" updated.', 'success')
        return redirect(url_for('accessories.accessory_detail', accessory_id=accessory.id))

    return render_template('accessories/form.html', accessory=accessory, categories=ACCESSORY_CATEGORIES)


@accessories_bp.route('/<int:accessory_id>/delete', methods=['POST'])
def delete_accessory(accessory_id):
    accessory = Accessory.query.get_or_404(accessory_id)
    name = accessory.name

    for slot in accessory.build_slots:
        slot.accessory_id = None

    db.session.delete(accessory)
    db.session.commit()
    flash(f'"{name}" removed from the vault.', 'success')
    return redirect(url_for('accessories.list_accessories'))


@accessories_bp.route('/api/list')
def api_list():
    category = request.args.get('category')
    exclude_build = request.args.get('exclude_build', type=int)

    query = Accessory.query
    if category:
        query = query.filter_by(category=category)

    accessories = query.order_by(Accessory.name).all()

    result = []
    for a in accessories:
        result.append({
            'id': a.id,
            'name': a.name,
            'make': a.make,
            'model': a.model,
            'category': a.category,
            'category_label': a.category_label,
            'total_rounds': a.total_rounds,
            'image_path': a.image_path,
            'price_paid': a.price_paid,
        })

    return jsonify(result)
