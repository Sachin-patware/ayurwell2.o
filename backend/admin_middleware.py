from flask_jwt_extended import get_jwt
from functools import wraps
from flask import jsonify

def admin_required(fn):
    """
    Decorator to require admin role in JWT claims.
    Use this decorator after @jwt_required() to protect admin-only routes.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper
