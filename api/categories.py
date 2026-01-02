from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Category, SubCategory
from extensions import db

categories_bp = Blueprint("categories", __name__)

@categories_bp.route("/categories", methods=["GET", "POST"])
@login_required
def categories():
    if request.method == "POST":
        name = request.json.get("name")
        if not name:
            return jsonify({"error": "Name required"}), 400
        category = Category(name=name)
        db.session.add(category)
        db.session.commit()
        return jsonify({"id": category.id, "name": category.name})

    categories = Category.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories])

@categories_bp.route("/subcategories", methods=["GET", "POST"])
@login_required
def subcategories():
    if request.method == "POST":
        data = request.json
        name = data.get("name")
        category_id = data.get("category_id")
        if not name or not category_id:
            return jsonify({"error": "Name and category_id required"}), 400
        # Validate category exists
        if not Category.query.get(category_id):
            return jsonify({"error": "Invalid category_id"}), 400

        subcat = SubCategory(name=name, category_id=category_id)
        db.session.add(subcat)
        db.session.commit()
        return jsonify({"id": subcat.id, "name": subcat.name, "category_id": category_id})

    # Optional: filter by category_id query param
    category_id = request.args.get("category_id")
    query = SubCategory.query
    if category_id:
        query = query.filter_by(category_id=category_id)

    subcategories = query.all()
    return jsonify([{"id": s.id, "name": s.name, "category_id": s.category_id} for s in subcategories])

