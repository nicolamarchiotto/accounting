from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Owner
from extensions import db

owners_bp = Blueprint("owners", __name__)

@owners_bp.route('/owners', methods=['GET'])
@login_required
def get_owners():
    owners = Owner.query.all()
    return jsonify([{"id": o.id, "name": o.name} for o in owners])
    
@owners_bp.route('/owners', methods=['POST'])
@login_required
def add_owner():
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    # Check if owner already exists
    existing_owner = Owner.query.filter_by(name=name).first()
    if existing_owner:
        return jsonify({"error": "Owner already exists"}), 400

    new_owner = Owner(name=name)
    db.session.add(new_owner)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error: " + str(e)}), 500

    return jsonify({"id": new_owner.id, "name": new_owner.name}), 201


@owners_bp.route("/owners/remove/<int:owner_id>", methods=["DELETE"])
@login_required
def remove_owner(owner_id):
    owner = Owner.query.get(owner_id)
    if not owner:
        return jsonify({"error": "Owner not found"}), 404
    
    try:
        db.session.delete(owner)
        db.session.commit()
        return jsonify({"success": True, "message": f"Owner with ID {owner_id} deleted"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete owner", "details": str(e)}), 500
    
@owners_bp.route("/owners/edit/<int:owner_id>", methods=["PUT"])
@login_required
def edit_owner(owner_id):
    data = request.get_json()
    new_name = data.get("name", "").strip()
    if not new_name:
        return jsonify({"error": "New name is required"}), 400
    
    owner = Owner.query.get(owner_id)
    if not owner:
        return jsonify({"error": "Owner not found"}), 404
    
    try:
        owner.name = new_name
        db.session.commit()
        return jsonify({"success": True, "message": f"Owner with ID {owner_id} updated", "owner": {"id": owner.id, "name": owner.name}})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update owner", "details": str(e)}), 500