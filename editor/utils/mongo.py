from pymongo import MongoClient
from django.conf import settings
from bson import ObjectId
import datetime

_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI)
    return _client[settings.MONGO_DB_NAME]

def get_sessions_collection():
    return get_db()['sessions']

def get_fonts_collection():
    return get_db()['fonts']

def serialize_doc(doc):
    if not doc:
        return None
    doc['id'] = str(doc.pop('_id'))
    if 'created_at' in doc and isinstance(doc['created_at'], datetime.datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    if 'updated_at' in doc and isinstance(doc['updated_at'], datetime.datetime):
        doc['updated_at'] = doc['updated_at'].isoformat()
    return doc

# Session Helpers
def get_all_sessions():
    """Returns list of sessions with minimal info."""
    cursor = get_sessions_collection().find({}, {"name": 1, "updated_at": 1, "created_at": 1}).sort("updated_at", -1)
    return [serialize_doc(doc) for doc in cursor]

def get_session(session_id):
    """Returns full session data."""
    try:
        doc = get_sessions_collection().find_one({"_id": ObjectId(session_id)})
        return serialize_doc(doc)
    except Exception:
        return None

def create_session(name, slides=None):
    if slides is None:
        slides = []

    doc = {
        "name": name,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
        "slides": slides
    }
    res = get_sessions_collection().insert_one(doc)
    doc['_id'] = res.inserted_id
    return serialize_doc(doc)

def update_session(session_id, data):
    """
    data should contain 'name' and/or 'slides'.
    """
    update_fields = {"updated_at": datetime.datetime.utcnow()}
    if 'name' in data:
        update_fields['name'] = data['name']
    if 'slides' in data:
        update_fields['slides'] = data['slides']

    get_sessions_collection().update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_fields}
    )
    return get_session(session_id)

def delete_session(session_id):
    try:
        get_sessions_collection().delete_one({"_id": ObjectId(session_id)})
        return True
    except:
        return False

# Font Helpers
def save_font_metadata(name, filename):
    doc = {
        "name": name,
        "filename": filename,
        "uploaded_at": datetime.datetime.utcnow()
    }
    get_fonts_collection().insert_one(doc)

def get_all_fonts():
    cursor = get_fonts_collection().find({})
    return [serialize_doc(doc) for doc in cursor]
