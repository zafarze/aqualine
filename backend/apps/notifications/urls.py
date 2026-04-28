from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    push_subscribe,
    push_unsubscribe,
    vapid_public_key,
)

router = DefaultRouter()
router.register("", NotificationViewSet, basename="notification")

urlpatterns = [
    path("push/vapid-public-key/", vapid_public_key, name="vapid-public-key"),
    path("push/subscribe/", push_subscribe, name="push-subscribe"),
    path("push/unsubscribe/", push_unsubscribe, name="push-unsubscribe"),
    *router.urls,
]
