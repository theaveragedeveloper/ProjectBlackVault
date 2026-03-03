from datetime import datetime
from app import db


SLOT_TYPES = [
    ('optic', 'Optic'),
    ('muzzle', 'Muzzle Device'),
    ('barrel', 'Barrel'),
    ('underbarrel', 'Underbarrel'),
    ('stock', 'Stock'),
    ('grip', 'Pistol Grip'),
    ('magazine', 'Magazine'),
    ('trigger', 'Trigger'),
    ('light', 'Light / Laser'),
    ('suppressor', 'Suppressor'),
    ('handguard', 'Handguard'),
    ('sling', 'Sling'),
    ('other', 'Other'),
]

SLOT_SECTIONS = {
    'BARREL': ['barrel', 'muzzle', 'suppressor', 'handguard'],
    'OPTICS': ['optic'],
    'UNDERBARREL': ['underbarrel', 'light'],
    'STOCK & GRIP': ['stock', 'grip'],
    'INTERNALS': ['trigger', 'magazine'],
    'ACCESSORIES': ['sling', 'other'],
}

ACCESSORY_CATEGORIES = [
    ('optic', 'Optic / Scope'),
    ('muzzle', 'Muzzle Device'),
    ('barrel', 'Barrel'),
    ('underbarrel', 'Underbarrel Grip'),
    ('stock', 'Stock'),
    ('grip', 'Pistol Grip'),
    ('magazine', 'Magazine'),
    ('trigger', 'Trigger'),
    ('light', 'Light / Laser'),
    ('suppressor', 'Suppressor'),
    ('handguard', 'Handguard'),
    ('sling', 'Sling'),
    ('other', 'Other'),
]

MAINTENANCE_TYPES = [
    ('cleaning', 'Cleaning'),
    ('inspection', 'Inspection'),
    ('repair', 'Repair'),
    ('battery_change', 'Battery Change'),
    ('lubrication', 'Lubrication'),
    ('zero', 'Zero / Sight-In'),
    ('other', 'Other'),
]


class Firearm(db.Model):
    __tablename__ = 'firearm'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    make = db.Column(db.String(100))
    model = db.Column(db.String(100))
    caliber = db.Column(db.String(50))
    firearm_type = db.Column(db.String(50))
    serial_number = db.Column(db.String(100))
    date_acquired = db.Column(db.Date)
    price_paid = db.Column(db.Float)
    image_path = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    builds = db.relationship('Build', backref='firearm', lazy=True, cascade='all, delete-orphan')
    round_logs = db.relationship('RoundLog', backref='firearm', lazy=True, cascade='all, delete-orphan')
    maintenance_logs = db.relationship('MaintenanceLog', backref='firearm', lazy=True, cascade='all, delete-orphan')

    @property
    def total_rounds(self):
        return sum(log.rounds for log in self.round_logs)

    @property
    def active_build(self):
        return Build.query.filter_by(firearm_id=self.id, is_active=True).first()

    @property
    def display_name(self):
        parts = [p for p in [self.make, self.model] if p]
        return f"{self.name} ({' '.join(parts)})" if parts else self.name


class Accessory(db.Model):
    __tablename__ = 'accessory'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    make = db.Column(db.String(100))
    model = db.Column(db.String(100))
    serial_number = db.Column(db.String(100))
    date_acquired = db.Column(db.Date)
    price_paid = db.Column(db.Float)
    last_battery_change = db.Column(db.Date)
    image_path = db.Column(db.String(255))
    notes = db.Column(db.Text)
    total_rounds = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    build_slots = db.relationship('BuildSlot', backref='accessory', lazy=True)
    maintenance_logs = db.relationship('MaintenanceLog', backref='accessory', lazy=True)

    @property
    def category_label(self):
        for key, label in ACCESSORY_CATEGORIES:
            if key == self.category:
                return label
        return self.category or 'Uncategorized'

    @property
    def current_build(self):
        active_slot = (BuildSlot.query
                       .filter_by(accessory_id=self.id)
                       .join(Build)
                       .filter(Build.is_active == True)
                       .first())
        return active_slot.build if active_slot else None


class Build(db.Model):
    __tablename__ = 'build'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    firearm_id = db.Column(db.Integer, db.ForeignKey('firearm.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    slots = db.relationship('BuildSlot', backref='build', lazy=True, cascade='all, delete-orphan')
    round_logs = db.relationship('RoundLog', backref='build', lazy=True)

    @property
    def total_rounds(self):
        return sum(log.rounds for log in self.round_logs)

    @property
    def accessories(self):
        return [slot.accessory for slot in self.slots if slot.accessory_id is not None]

    @property
    def total_value(self):
        return sum(a.price_paid or 0 for a in self.accessories)


class BuildSlot(db.Model):
    __tablename__ = 'build_slot'

    id = db.Column(db.Integer, primary_key=True)
    build_id = db.Column(db.Integer, db.ForeignKey('build.id'), nullable=False)
    accessory_id = db.Column(db.Integer, db.ForeignKey('accessory.id'), nullable=True)
    slot_type = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def slot_label(self):
        for key, label in SLOT_TYPES:
            if key == self.slot_type:
                return label
        return self.slot_type.replace('_', ' ').title()


class RoundLog(db.Model):
    __tablename__ = 'round_log'

    id = db.Column(db.Integer, primary_key=True)
    firearm_id = db.Column(db.Integer, db.ForeignKey('firearm.id'), nullable=False)
    build_id = db.Column(db.Integer, db.ForeignKey('build.id'), nullable=True)
    rounds = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    ammo_type = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MaintenanceLog(db.Model):
    __tablename__ = 'maintenance_log'

    id = db.Column(db.Integer, primary_key=True)
    firearm_id = db.Column(db.Integer, db.ForeignKey('firearm.id'), nullable=True)
    accessory_id = db.Column(db.Integer, db.ForeignKey('accessory.id'), nullable=True)
    maintenance_type = db.Column(db.String(100))
    date = db.Column(db.Date, nullable=False)
    cost = db.Column(db.Float)
    notes = db.Column(db.Text)
    next_service_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def type_label(self):
        for key, label in MAINTENANCE_TYPES:
            if key == self.maintenance_type:
                return label
        return self.maintenance_type or 'Other'
