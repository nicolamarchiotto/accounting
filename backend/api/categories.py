from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Category, SubCategory, Entry
from extensions import db

categories_bp = Blueprint("categories", __name__)

@categories_bp.route("/categories", methods=["GET", "POST"])
@login_required
def get_categories():
    if request.method == "POST":
        name = request.json.get("name")
        if not name:
            return jsonify({"error": "Name required"}), 400
        
        # Check if category already exists
        existing = Category.query.filter_by(name=name).first()
        if existing:
            return jsonify({"error": "Category already exists"}), 409
        
        category = Category(name=name)
        db.session.add(category)
        db.session.commit()
        return jsonify({"id": category.id, "name": category.name})

    categories = Category.query.all()
    result = []
    for c in categories:
        result.append({
            "id": c.id,
            "name": c.name,
            "subcategories": [
                {
                    "id": sc.id,
                    "name": sc.name
                }
                for sc in c.subcategories
            ]
        })

    return jsonify(result), 200

@categories_bp.route("/categories/info/<int:category_id>", methods=["POST"])
@login_required
def info_category(category_id):
    category = Category.query.get_or_404(category_id)

    if not category:
        return jsonify({"error": "Category not found"}), 404
    
    subcategories = category.subcategories

    return jsonify({
        "category_id": category.id,
        "category_name": category.name,
        "subcategories_count": len(subcategories),
    })

@categories_bp.route("/categories/edit/<int:category_id>", methods=["PUT"])
@login_required
def edit_category(category_id):
    data = request.get_json()
    new_name = data.get("name", "").strip()
    if not new_name:
        return jsonify({"error": "New name is required"}), 400
    
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404
    
    try:
        category.name = new_name
        db.session.commit()
        return jsonify({"success": True, "message": f"Category with ID {category_id} updated", "category": {"id": category.id, "name": category.name}})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update category", "details": str(e)}), 500
    
@categories_bp.route("/categories/remove/<int:category_id>", methods=["DELETE"])
@login_required
def remove_category(category_id):
    try:
        category = Category.query.get_or_404(category_id)

        # Delete related sub category entries
        for sub_category in category.subcategories:
            Entry.query.filter_by(sub_category_id=sub_category.id).delete()
        
        # Delete related category entries
        Entry.query.filter_by(category_id=category.id).delete()

        # Delete subcategories
        SubCategory.query.filter_by(category_id=category.id).delete()
        # Delete category
        db.session.delete(category)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to remove category", "details": str(e)}), 500

    return jsonify({"success": True})

@categories_bp.route("/subcategories/edit/<int:subcategory_id>", methods=["PUT"])
@login_required
def edit_subcategories(subcategory_id):
    new_name = request.json.get("name")
    if not new_name or not subcategory_id:
        return jsonify({"error": "Name and subcategory required"}), 400
    
    
    subcategory = SubCategory.query.get(subcategory_id)
    if not subcategory:
        return jsonify({"error": "SubCategory not found"}), 404
    
    try:
        subcategory.name = new_name
        db.session.commit()
        return jsonify({"success": True, "message": f"SubCategory with ID {subcategory_id} updated", "category": {"id": subcategory.id, "name": subcategory.name}})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update category", "details": str(e)}), 500

@categories_bp.route("/subcategories/remove/<int:subcategory_id>", methods=["DELETE"])
@login_required
def remove_subcategory(subcategory_id):
    try:
        subcategory = SubCategory.query.get_or_404(subcategory_id)
        
        # Delete related subcategory entries
        Entry.query.filter_by(sub_category_id=subcategory.id).delete()

        # Delete subcategory
        db.session.delete(subcategory)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to remove subcategory", "details": str(e)}), 500

    return jsonify({"success": True})


@categories_bp.route("/subcategories", methods=["POST"])
@login_required
def subcategories():
    name = request.json.get("name")
    category_id = request.json.get("category_id")
    if not category_id:
        category_name = request.json.get("category_name")
        category = Category.query.filter_by(name=category_name).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404
        category_id = category.id

    if not name or not category_id:
        return jsonify({"error": "Name and category_id required"}), 400
    
    # Check if category already exists
    existing = SubCategory.query.filter_by(name=name, category_id=category_id).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 409
    
    subcategory = SubCategory(name=name, category_id=category_id)
    db.session.add(subcategory)
    db.session.commit()
    return jsonify({"id": subcategory.id, "name": subcategory.name})
