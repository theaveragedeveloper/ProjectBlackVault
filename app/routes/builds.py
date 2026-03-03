from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from app import db
from app.models import Firearm, Build, BuildSlot, Accessory, SLOT_TYPES, SLOT_SECTIONS

builds_bp = Blueprint('builds', __name__)


@builds_bp.route('/firearms/<int:firearm_id>/builds/add', methods=['GET', 'POST'])
def add_build(firearm_id):
    firearm = Firearm.query.get_or_404(firearm_id)

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Build name is required.', 'error')
            return render_template('builds/form.html', firearm=firearm, slot_types=SLOT_TYPES)

        build = Build(
            name=name,
            firearm_id=firearm_id,
            is_active=False,
            notes=request.form.get('notes', '').strip() or None,
        )
        db.session.add(build)
        db.session.flush()

        selected_slots = request.form.getlist('slots')
        for slot_type in selected_slots:
            slot = BuildSlot(build_id=build.id, slot_type=slot_type)
            db.session.add(slot)

        if not firearm.active_build:
            build.is_active = True

        db.session.commit()
        flash(f'Build "{build.name}" created.', 'success')
        return redirect(url_for('builds.configurator', firearm_id=firearm_id, build_id=build.id))

    return render_template('builds/form.html', firearm=firearm, slot_types=SLOT_TYPES)


@builds_bp.route('/firearms/<int:firearm_id>/builds/<int:build_id>')
def configurator(firearm_id, build_id):
    firearm = Firearm.query.get_or_404(firearm_id)
    build = Build.query.get_or_404(build_id)

    if build.firearm_id != firearm_id:
        flash('Build not found for this firearm.', 'error')
        return redirect(url_for('firearms.firearm_detail', firearm_id=firearm_id))

    slots_by_section = {}
    for section_name, slot_keys in SLOT_SECTIONS.items():
        section_slots = [s for s in build.slots if s.slot_type in slot_keys]
        if section_slots:
            slots_by_section[section_name] = section_slots

    other_slots = [s for s in build.slots
                   if not any(s.slot_type in keys for keys in SLOT_SECTIONS.values())]
    if other_slots:
        slots_by_section['ACCESSORIES'] = slots_by_section.get('ACCESSORIES', []) + other_slots

    all_accessories = Accessory.query.order_by(Accessory.category, Accessory.name).all()

    return render_template('builds/configurator.html',
                           firearm=firearm,
                           build=build,
                           slots_by_section=slots_by_section,
                           all_accessories=all_accessories,
                           slot_types=SLOT_TYPES,
                           slot_sections=SLOT_SECTIONS)


@builds_bp.route('/firearms/<int:firearm_id>/builds/<int:build_id>/activate', methods=['POST'])
def activate_build(firearm_id, build_id):
    firearm = Firearm.query.get_or_404(firearm_id)
    build = Build.query.get_or_404(build_id)

    for b in firearm.builds:
        b.is_active = False

    build.is_active = True
    db.session.commit()

    return jsonify({'success': True, 'message': f'Build "{build.name}" is now active.'})


@builds_bp.route('/firearms/<int:firearm_id>/builds/<int:build_id>/delete', methods=['POST'])
def delete_build(firearm_id, build_id):
    build = Build.query.get_or_404(build_id)
    was_active = build.is_active
    name = build.name
    db.session.delete(build)
    db.session.commit()

    if was_active:
        firearm = Firearm.query.get_or_404(firearm_id)
        remaining = Build.query.filter_by(firearm_id=firearm_id).first()
        if remaining:
            remaining.is_active = True
            db.session.commit()

    flash(f'Build "{name}" deleted.', 'success')
    return redirect(url_for('firearms.firearm_detail', firearm_id=firearm_id))


@builds_bp.route('/api/builds/<int:build_id>/slots/<slot_type>/attach', methods=['POST'])
def attach_accessory(build_id, slot_type):
    build = Build.query.get_or_404(build_id)
    data = request.get_json()
    accessory_id = data.get('accessory_id')

    if not accessory_id:
        return jsonify({'success': False, 'error': 'No accessory ID provided'}), 400

    accessory = Accessory.query.get_or_404(accessory_id)

    slot = BuildSlot.query.filter_by(build_id=build_id, slot_type=slot_type).first()
    if not slot:
        slot = BuildSlot(build_id=build_id, slot_type=slot_type)
        db.session.add(slot)

    slot.accessory_id = accessory_id
    db.session.commit()

    return jsonify({
        'success': True,
        'accessory': {
            'id': accessory.id,
            'name': accessory.name,
            'make': accessory.make,
            'model': accessory.model,
            'total_rounds': accessory.total_rounds,
            'image_path': accessory.image_path,
            'last_battery_change': accessory.last_battery_change.isoformat() if accessory.last_battery_change else None,
        }
    })


@builds_bp.route('/api/builds/<int:build_id>/slots/<slot_type>/detach', methods=['POST'])
def detach_accessory(build_id, slot_type):
    slot = BuildSlot.query.filter_by(build_id=build_id, slot_type=slot_type).first()
    if slot:
        slot.accessory_id = None
        db.session.commit()

    return jsonify({'success': True})


@builds_bp.route('/api/builds/<int:build_id>/slots/add', methods=['POST'])
def add_slot(build_id):
    build = Build.query.get_or_404(build_id)
    data = request.get_json()
    slot_type = data.get('slot_type')

    if not slot_type:
        return jsonify({'success': False, 'error': 'No slot type provided'}), 400

    existing = BuildSlot.query.filter_by(build_id=build_id, slot_type=slot_type).first()
    if existing:
        return jsonify({'success': False, 'error': 'Slot already exists in this build'}), 400

    slot = BuildSlot(build_id=build_id, slot_type=slot_type)
    db.session.add(slot)
    db.session.commit()

    return jsonify({'success': True, 'slot_id': slot.id, 'slot_type': slot_type, 'slot_label': slot.slot_label})


@builds_bp.route('/api/builds/<int:build_id>/slots/<slot_type>/remove', methods=['POST'])
def remove_slot(build_id, slot_type):
    slot = BuildSlot.query.filter_by(build_id=build_id, slot_type=slot_type).first()
    if slot:
        db.session.delete(slot)
        db.session.commit()

    return jsonify({'success': True})
