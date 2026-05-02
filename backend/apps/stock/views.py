from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.products.models import Product
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

    @action(detail=False, methods=["get"], url_path="balances")
    def balances(self, request):
        """Сводная остатки по продукту/складу.

        Считает алгебраическую сумму движений: IN/RETURN/INVENTORY/UNRESERVE → +,
        OUT/RESERVE → −. TRANSFER обрабатывается через `warehouse_to`.
        """
        warehouse_id = request.query_params.get("warehouse")
        movements = StockMovement.objects.all()
        if warehouse_id:
            movements = movements.filter(
                Q(warehouse_id=warehouse_id) | Q(warehouse_to_id=warehouse_id)
            )

        balances: dict[int, dict] = {}
        for product in Product.objects.filter(is_active=True).only(
            "id", "sku", "name", "unit", "stock", "min_stock"
        ):
            balances[product.id] = {
                "product_id": product.id,
                "sku": product.sku,
                "name": product.name,
                "unit": product.unit,
                "stock": str(product.stock),
                "min_stock": str(product.min_stock),
                "below_min": product.stock < product.min_stock,
            }
        return Response(list(balances.values()))
