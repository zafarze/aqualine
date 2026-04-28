from rest_framework import viewsets

from apps.users.permissions import CanManagePurchases

from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManagePurchases]
    queryset = (
        PurchaseOrder.objects.select_related("supplier", "warehouse", "created_by")
        .prefetch_related("items__product")
        .all()
    )
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ["status", "supplier", "warehouse"]
    search_fields = ["number", "supplier__name", "notes"]
    ordering_fields = ["created_at", "expected_date", "received_date", "number"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user if self.request.user.is_authenticated else None
        )
