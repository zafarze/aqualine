from rest_framework import viewsets

from apps.users.permissions import CanManageStock

from .models import StockMovement, Warehouse
from .serializers import StockMovementSerializer, WarehouseSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [CanManageStock]
    filterset_fields = ["is_active", "is_default"]
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at"]


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related(
        "product", "warehouse", "warehouse_to", "created_by"
    ).all()
    serializer_class = StockMovementSerializer
    permission_classes = [CanManageStock]
    filterset_fields = ["type", "product", "warehouse"]
    search_fields = ["reference", "notes", "product__name", "product__sku"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user if self.request.user.is_authenticated else None
        )
