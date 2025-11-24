from django.urls import path
from . import views

urlpatterns = [
    path("import/", views.import_data, name="import_data"),
    path("events/", views.events_list, name="events_list"),
    path("agg/avg-intensity-by-year/", views.agg_avg_intensity_by_year, name="agg_avg_intensity_by_year"),
    path("meta/filters/", views.meta_filters, name="meta_filters"),

    # new endpoints
    path("agg/count-by-country/", views.agg_count_by_country, name="agg_count_by_country"),
    path("agg/count-by-sector/", views.agg_count_by_sector, name="agg_count_by_sector"),
    path("agg/top-topics/", views.agg_top_topics, name="agg_top_topics"),
    path("agg/topics-by-region/", views.agg_topics_by_region, name="agg_topics_by_region"),
    path("agg/scatter-intensity-likelihood/", views.agg_scatter_intensity_likelihood, name="agg_scatter_intensity_likelihood"),
    path("agg/count-by-year/", views.agg_count_by_year, name="agg_count_by_year"),
    path("export/csv/", views.export_csv, name="export_csv"),
]
