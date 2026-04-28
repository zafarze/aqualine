from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    unit_display = serializers.CharField(source="get_unit_display", read_only=True)
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "unit",
            "unit_display",
            "purchase_price",
            "sale_price",
            "stock",
            "reserved",
            "min_stock",
            "stock_status",
            "barcode",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_stock_status(self, obj: Product) -> str:
        available = (obj.stock or 0) - (obj.reserved or 0)
        if available <= 0:
            return "out_of_stock"
        if available <= (obj.min_stock or 0):
            return "reorder"
        return "available"
