# api/views.py
import os
import json
from dateutil import parser
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework import status
from pymongo import ASCENDING, DESCENDING
from .db import get_collection
from django.http import HttpResponse
import csv
from bson import ObjectId
from pymongo import DESCENDING

def _transform_item(i):
    # basic transforms: parse published into ISO + year
    i = dict(i)  # copy
    if "published" in i and i.get("published"):
        try:
            dt = parser.parse(i["published"])
            i["published_iso"] = dt.isoformat()
            i["published_year"] = dt.year
        except Exception:
            pass
    # convert numeric-like strings to ints if needed
    for fld in ("intensity", "likelihood", "relevance"):
        if fld in i and isinstance(i[fld], str) and i[fld].isdigit():
            i[fld] = int(i[fld])
    return i

@api_view(["POST"])
def import_data(request):
    """
    POST /api/import/
    Reads backend/data.json (must be present) and inserts into Mongo.
    For production use a safer import flow.
    """
    col = get_collection()
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "jsondata.json")
    if not os.path.exists(file_path):
        return JsonResponse({"error": "data.json not found on server"}, status=404)
    with open(file_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    docs = []
    for it in items:
        docs.append(_transform_item(it))
    # clear & insert (for demo)
    col.delete_many({})
    if docs:
        col.insert_many(docs)
    return JsonResponse({"imported": len(docs)}, status=201)

@api_view(["GET"])
def events_list(request):
    """
    GET /api/events/
    Query params (optional): page, limit, region, country, topic, sector, source, pestle, swot,
    end_year_min, end_year_max, year.
    Example: /api/events/?country=India&topic=gas&page=1&limit=50
    """
    col = get_collection()
    q = {}
    # simple equality/membership filters
    filters = ["region", "country", "topic", "sector", "source", "pestle", "swot", "city"]
    for f in filters:
        val = request.GET.get(f)
        if val:
            q[f] = {"$in": [v.strip() for v in val.split(",")]}
    # year filters
    if request.GET.get("year"):
        try:
            year = int(request.GET.get("year"))
            q["published_year"] = year
        except:
            pass
    if request.GET.get("end_year_min") or request.GET.get("end_year_max"):
        rng = {}
        if request.GET.get("end_year_min"):
            try:
                rng["$gte"] = int(request.GET.get("end_year_min"))
            except:
                pass
        if request.GET.get("end_year_max"):
            try:
                rng["$lte"] = int(request.GET.get("end_year_max"))
            except:
                pass
        if rng:
            q["end_year"] = rng

    # search (text) on title or insight
    if search := request.GET.get("search"):
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"insight": {"$regex": search, "$options": "i"}},
        ]

    # pagination
    try:
        page = int(request.GET.get("page", 1))
        limit = min(int(request.GET.get("limit", 50)), 1000)
    except:
        page, limit = 1, 50
    skip = (page - 1) * limit

    total = col.count_documents(q)
    cursor = col.find(q).skip(skip).limit(limit).sort("published_iso", DESCENDING)
    objs = []
    for doc in cursor:
        doc.pop("_id", None)
        objs.append(doc)

    return JsonResponse({"total": total, "page": page, "limit": limit, "results": objs}, safe=False)

@api_view(["GET"])
def agg_avg_intensity_by_year(request):
    """
    GET /api/agg/avg-intensity-by-year/
    Optional filters same as events_list.
    Returns: [{ year: 2017, avgIntensity: 4.5, count: 10 }, ...]
    """
    col = get_collection()
    q = {}
    # re-use only a subset of filters for brevity
    for f in ("region", "country", "topic", "sector", "source", "pestle", "swot"):
        val = request.GET.get(f)
        if val:
            q[f] = {"$in": [v.strip() for v in val.split(",")]}

    pipeline = [
        {"$match": q},
        {"$group": {
            "_id": "$published_year",
            "avgIntensity": {"$avg": {"$cond": [{ "$isNumber": "$intensity" }, "$intensity", None]}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    res = list(col.aggregate(pipeline))
    out = []
    for r in res:
        out.append({"year": r["_id"], "avgIntensity": r.get("avgIntensity"), "count": r.get("count")})
    return JsonResponse(out, safe=False)

@api_view(["GET"])
def meta_filters(request):
    """
    GET /api/meta/filters/
    Returns distinct values for fields used in UI dropdowns.
    """
    col = get_collection()
    fields = ["region", "country", "topic", "sector", "source", "pestle", "swot", "city", "published_year", "end_year"]
    out = {}
    for f in fields:
        vals = col.distinct(f)
        # sort years numeric if possible
        if f in ("published_year", "end_year"):
            try:
                vals = sorted([int(v) for v in vals if v not in (None, "", " ")])
            except:
                vals = sorted(vals)
        else:
            vals = sorted([v for v in vals if v not in (None, "", " ")])
        out[f] = vals
    return JsonResponse(out, safe=False)



# -----------------------
# helper: build filter dict (reuse across endpoints)
# -----------------------
def _build_filters_from_request(request, allowed=("region","country","topic","sector","source","pestle","swot","city","start_year","end_year")):
    q = {}
    for f in allowed:
        val = request.GET.get(f)
        if val:
            q[f] = {"$in": [v.strip() for v in val.split(",")]}
    # year range handling for published_year
    if request.GET.get("year"):
        try:
            q["published_year"] = int(request.GET.get("year"))
        except:
            pass
    # allow numeric intensity/likelihood/relevance filters
    for num in ("intensity_min","intensity_max","likelihood_min","likelihood_max","relevance_min","relevance_max"):
        if request.GET.get(num):
            try:
                v = int(request.GET.get(num))
                fld = num.rsplit("_",1)[0]
                op = "$gte" if num.endswith("_min") else "$lte"
                q.setdefault(fld, {})
                q[fld][op] = v
            except:
                pass
    # search text
    if s := request.GET.get("search"):
        q["$or"] = [
            {"title": {"$regex": s, "$options": "i"}},
            {"insight": {"$regex": s, "$options": "i"}},
        ]
    return q

# -----------------------
# 1) Count by country
# GET /api/agg/count-by-country/
# -----------------------
@api_view(["GET"])
def agg_count_by_country(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    pipeline = [
        {"$match": q},
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    res = list(col.aggregate(pipeline))
    out = [{"country": r["_id"], "count": r["count"]} for r in res if r["_id"] not in (None, "", " ")]
    return JsonResponse(out, safe=False)

# -----------------------
# 2) Count by sector (top sectors)
# GET /api/agg/count-by-sector/
# -----------------------
@api_view(["GET"])
def agg_count_by_sector(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    pipeline = [
        {"$match": q},
        {"$group": {"_id": "$sector", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    res = list(col.aggregate(pipeline))
    out = [{"sector": r["_id"], "count": r["count"]} for r in res if r["_id"] not in (None, "", " ")]
    return JsonResponse(out, safe=False)

# -----------------------
# 3) Top topics (limit optional)
# GET /api/agg/top-topics/?limit=10
# -----------------------
@api_view(["GET"])
def agg_top_topics(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    limit = int(request.GET.get("limit", 10))
    pipeline = [
        {"$match": q},
        {"$group": {"_id": "$topic", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    res = list(col.aggregate(pipeline))
    out = [{"topic": r["_id"], "count": r["count"]} for r in res if r["_id"] not in (None, "", " ")]
    return JsonResponse(out, safe=False)

# -----------------------
# 4) Topics by region (grouped) — good for stacked bars / treemap
# GET /api/agg/topics-by-region/
# -----------------------
@api_view(["GET"])
def agg_topics_by_region(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    pipeline = [
        {"$match": q},
        {"$group": {"_id": {"region": "$region", "topic": "$topic"}, "count": {"$sum": 1}}},
        {"$group": {"_id": "$_id.region", "topics": {"$push": {"topic": "$_id.topic", "count": "$count"}}}},
        {"$sort": {"_id": 1}}
    ]
    res = list(col.aggregate(pipeline))
    out = []
    for r in res:
        region = r["_id"] or "Unknown"
        topics = sorted([t for t in r.get("topics", []) if t.get("topic") not in (None, "", " ")], key=lambda x: -x["count"])
        out.append({"region": region, "topics": topics})
    return JsonResponse(out, safe=False)

# -----------------------
# 5) Scatter points: intensity vs likelihood (with relevance as size)
# GET /api/agg/scatter-intensity-likelihood/?limit=1000
# -----------------------
@api_view(["GET"])
def agg_scatter_intensity_likelihood(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    limit = min(int(request.GET.get("limit", 2000)), 5000)
    projection = {
        "_id": 0,
        "intensity": 1, "likelihood": 1, "relevance": 1,
        "country": 1, "region": 1, "topic": 1, "published_year": 1, "title": 1
    }
    cursor = col.find(q, projection).limit(limit)
    pts = []
    for d in cursor:
        # ensure numeric values
        try:
            intensity = float(d.get("intensity")) if d.get("intensity") is not None else None
        except:
            intensity = None
        try:
            likelihood = float(d.get("likelihood")) if d.get("likelihood") is not None else None
        except:
            likelihood = None
        pts.append({
            "intensity": intensity,
            "likelihood": likelihood,
            "relevance": d.get("relevance"),
            "country": d.get("country"),
            "region": d.get("region"),
            "topic": d.get("topic"),
            "year": d.get("published_year"),
            "title": d.get("title")
        })
    return JsonResponse(pts, safe=False)

# -----------------------
# 6) Count by year (time series counts) — suitable for trend / stacked area
# GET /api/agg/count-by-year/?group_by=published_year (default)
# -----------------------
@api_view(["GET"])
def agg_count_by_year(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    group_field = request.GET.get("group_by", "published_year")
    pipeline = [
        {"$match": q},
        {"$group": {"_id": f"${group_field}", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    res = list(col.aggregate(pipeline))
    out = [{"year": r["_id"], "count": r["count"]} for r in res if r["_id"] not in (None, "", " ")]
    return JsonResponse(out, safe=False)

# -----------------------
# 7) Export filtered data as CSV
# GET /api/export/csv/?fields=title,country,topic
# -----------------------
@api_view(["GET"])
def export_csv(request):
    col = get_collection()
    q = _build_filters_from_request(request)
    # fields to include in CSV (default simple set)
    fields = request.GET.get("fields")
    if fields:
        fields = [f.strip() for f in fields.split(",")]
    else:
        fields = ["title", "country", "region", "topic", "sector", "published_year", "intensity", "likelihood", "relevance", "source"]
    cursor = col.find(q, {f: 1 for f in fields})
    # build CSV in memory
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = "attachment; filename=export.csv"
    writer = csv.writer(response)
    writer.writerow(fields)
    for doc in cursor:
        row = [doc.get(f, "") for f in fields]
        writer.writerow(row)
    return response
