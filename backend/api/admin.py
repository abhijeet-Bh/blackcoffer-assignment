# api/admin.py
from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse
from .db import get_collection

def _prepare_docs(cursor, limit=200):
    out = []
    for d in list(cursor.limit(limit)):
        d = dict(d)
        # convert ObjectId to a safe key name
        if "_id" in d:
            d["mongo_id"] = str(d.pop("_id"))
        else:
            d["mongo_id"] = ""
        # shorten long text fields for display
        if "insight" in d and isinstance(d["insight"], str):
            d["insight_short"] = (d["insight"][:200] + "...") if len(d["insight"]) > 200 else d["insight"]
        out.append(d)
    return out

def mongo_events_view(request):
    col = get_collection()
    q = {}
    # optional: support query params like ?country=India
    country = request.GET.get("country")
    if country:
        q["country"] = country
    cursor = col.find(q).sort("published_iso", -1)
    docs = _prepare_docs(cursor, limit=500)
    context = dict(
        self=admin.site,
        title="Mongo Events (preview)",
        docs=docs,
        opts=admin.site._registry,
        request=request,   # pass request so template can read request.GET if needed
    )
    return TemplateResponse(request, "admin/mongo_events.html", context)

# attach a new URL to admin site
def get_admin_urls(urls):
    def get_urls():
        my_urls = [
            path("mongo-events/", admin.site.admin_view(mongo_events_view), name="mongo-events"),
        ]
        return my_urls + urls()
    return get_urls

admin.site.get_urls = get_admin_urls(admin.site.get_urls)
