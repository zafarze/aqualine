from decimal import Decimal

from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    price = serializers.DecimalField(
        source="product.sale_price", max_digits=12, decimal_places=2, read_only=True
    )
    sum = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id", "product", "product_name", "product_sku",
            "product_unit", "price", "quantity", "sum",
        ]

    def get_sum(self, obj: CartItem) -> str:
        return str((obj.product.sale_price * obj.quantity).quantize(Decimal("0.01")))


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total", "updated_at"]
