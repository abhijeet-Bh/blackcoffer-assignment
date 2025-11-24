# api/db.py
import os
from pymongo import MongoClient
from django.conf import settings

_client = None

def get_db():
    global _client
    if _client is None:
        uri = os.getenv("MONGO_URI", getattr(settings, "MONGO_URI", "mongodb://localhost:27017"))
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    dbname = os.getenv("MONGO_DBNAME", getattr(settings, "MONGO_DBNAME", "eventsdb"))
    return _client[dbname]

def get_collection():
    col_name = os.getenv("MONGO_COLLECTION", getattr(settings, "MONGO_COLLECTION", "events"))
    return get_db()[col_name]
