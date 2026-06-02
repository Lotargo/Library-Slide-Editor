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

def get_workspaces_collection():
    return get_db()['workspaces']

def get_pages_collection():
    return get_db()['pages']

def get_fonts_collection():
    return get_db()['fonts']

def serialize_doc(doc):
    if not doc:
        return None

    # Create a copy to prevent mutating the original document
    serialized = doc.copy()

    if '_id' in serialized:
        serialized['id'] = str(serialized.pop('_id'))
    if 'created_at' in serialized and isinstance(serialized['created_at'], datetime.datetime):
        serialized['created_at'] = serialized['created_at'].isoformat()
    if 'updated_at' in serialized and isinstance(serialized['updated_at'], datetime.datetime):
        serialized['updated_at'] = serialized['updated_at'].isoformat()
    return serialized

# Workspace Helpers
def get_all_workspaces():
    cursor = get_workspaces_collection().find({"deleted_at": {"$exists": False}}).sort("created_at", -1)
    return [serialize_doc(doc) for doc in cursor]

def create_workspace(name):
    doc = {
        "name": name,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    res = get_workspaces_collection().insert_one(doc)
    doc['_id'] = res.inserted_id
    return serialize_doc(doc)

def get_workspace(workspace_id):
    try:
        doc = get_workspaces_collection().find_one({"_id": ObjectId(workspace_id), "deleted_at": {"$exists": False}})
        if not doc:
            return None
        # Get pages for this workspace
        pages_cursor = get_pages_collection().find({"workspace_id": str(workspace_id), "deleted_at": {"$exists": False}}, {"title": 1, "updated_at": 1})
        pages = [serialize_doc(p) for p in pages_cursor]
        doc = serialize_doc(doc)
        doc['pages'] = pages
        return doc
    except Exception:
        return None

def update_workspace(workspace_id, data):
    update_fields = {"updated_at": datetime.datetime.utcnow()}
    if 'name' in data:
        update_fields['name'] = data['name']

    get_workspaces_collection().update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": update_fields}
    )
    return get_workspace(workspace_id)

def delete_workspace(workspace_id):
    try:
        # Soft delete workspace
        get_workspaces_collection().update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": {"deleted_at": datetime.datetime.utcnow()}}
        )
        # We do not soft-delete pages here to allow easier restoration.
        # Logic relying on get_workspace will filter them out anyway.
        return True
    except:
        return False

# Page Helpers
def create_page(workspace_id, title="Untitled"):
    doc = {
        "workspace_id": str(workspace_id),
        "title": title,
        "blocks": [], # Initial empty blocks
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    res = get_pages_collection().insert_one(doc)
    doc['_id'] = res.inserted_id
    return serialize_doc(doc)

def get_page(page_id):
    try:
        doc = get_pages_collection().find_one({"_id": ObjectId(page_id), "deleted_at": {"$exists": False}})
        return serialize_doc(doc)
    except:
        return None

def update_page(page_id, data):
    update_fields = {"updated_at": datetime.datetime.utcnow()}
    if 'title' in data:
        update_fields['title'] = data['title']
    if 'blocks' in data:
        update_fields['blocks'] = data['blocks']

    get_pages_collection().update_one(
        {"_id": ObjectId(page_id)},
        {"$set": update_fields}
    )
    return get_page(page_id)

def delete_page(page_id):
    try:
        get_pages_collection().update_one(
            {"_id": ObjectId(page_id)},
            {"$set": {"deleted_at": datetime.datetime.utcnow()}}
        )
        return True
    except:
        return False

# Font Helpers (Unchanged essentially)
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
