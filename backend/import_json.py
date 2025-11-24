# import_json.py
import os, json
from pymongo import MongoClient
from dateutil import parser

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DBNAME = os.getenv("MONGO_DBNAME", "eventsdb")
COL = os.getenv("MONGO_COLLECTION", "events")

client = MongoClient(MONGO_URI)
db = client[DBNAME]
col = db[COL]

fp = os.path.join(os.path.dirname(__file__), "jsondata.json")
with open(fp, "r", encoding="utf-8") as f:
    items = json.load(f)

def transform(i):
    i = dict(i)
    if "published" in i and i.get("published"):
        try:
            dt = parser.parse(i["published"])
            i["published_iso"] = dt.isoformat()
            i["published_year"] = dt.year
        except:
            pass
    for fld in ("intensity", "likelihood", "relevance"):
        if fld in i and isinstance(i[fld], str) and i[fld].isdigit():
            i[fld] = int(i[fld])
    return i

docs = [transform(it) for it in items]
col.delete_many({})
if docs:
    col.insert_many(docs)
print("Imported", col.count_documents({}), "documents")
