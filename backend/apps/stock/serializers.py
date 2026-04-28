from rest_framework import serializers

from .models import StockMovement, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            "id", "name", "code", "address", "is_active", "is_default", "created_at",
        ]
        read_only_fields = ["created_at"]


class StockMovementSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id", "type", "type_display", "product", "product_name", "product_sku",
            "warehouse", "warehouse_name", "warehouse_to", "quantity", "price",
            "reference", "notes", "created_by", "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]
