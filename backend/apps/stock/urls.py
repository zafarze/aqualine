from rest_framework.routers import DefaultRouter

from .views import StockMovementViewSet, WarehouseViewSet

router = DefaultRouter()
router.register("warehouses", WarehouseViewSet, basename="warehouse")
router.register("movements", StockMovementViewSet, basename="movement")

urlpatterns = router.urls
