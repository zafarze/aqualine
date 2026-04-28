from rest_framework.routers import DefaultRouter

from .views import (
    ClientInteractionViewSet,
    ClientTagViewSet,
    ClientTaskViewSet,
    ClientViewSet,
)

router = DefaultRouter()
router.register("interactions", ClientInteractionViewSet, basename="client-interaction")
router.register("tasks", ClientTaskViewSet, basename="client-task")
router.register("tags", ClientTagViewSet, basename="client-tag")
router.register("", ClientViewSet, basename="client")

urlpatterns = router.urls
