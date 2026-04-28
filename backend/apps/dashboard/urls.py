from django.urls import path

from .views import kpi, notifications

urlpatterns = [
    path("kpi/", kpi, name="dashboard-kpi"),
    path("notifications/", notifications, name="dashboard-notifications"),
]
