# create_indexes.py

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from api.db import get_collection

def create_indexes():
    col = get_collection()
    col.create_index([("published_year", 1)])
    col.create_index([("country", 1)])
    col.create_index([("region", 1)])
    col.create_index([("topic", 1)])
    col.create_index([("sector", 1)])
    col.create_index([("source", 1)])
    col.create_index([("intensity", 1)])
    col.create_index([("likelihood", 1)])
    print("Indexes created")

if __name__ == "__main__":
    create_indexes()
