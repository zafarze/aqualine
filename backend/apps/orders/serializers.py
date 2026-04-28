from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.finance.serializers import PaymentSerializer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_unit = serializers.CharField(
        source="product.get_unit_display", read_only=True
    )
    sum = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "product_unit",
            "quantity",
            "price",
            "discount",
            "sum",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    payments = PaymentSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    manager_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    total = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    paid_amount = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "client",
            "client_name",
            "manager",
            "manager_name",
            "status",
            "status_display",
            "due_date",
            "notes",
            "items",
            "payments",
            "total",
            "paid_amount",
            "balance_due",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["number", "created_at", "updated_at"]

    def get_manager_name(self, obj: Order) -> str:
        if obj.manager_id is None:
            return ""
        return obj.manager.get_full_name() or obj.manager.username

    def _paid(self, obj: Order) -> Decimal:
        total = Decimal("0")
        for p in obj.payments.all():
            total += p.amount
        return total.quantize(Decimal("0.01"))

    def get_paid_amount(self, obj: Order) -> str:
        return str(self._paid(obj))

    def get_balance_due(self, obj: Order) -> str:
        return str((obj.total - self._paid(obj)).quantize(Decimal("0.01")))

    @transaction.atomic
    def create(self, validated_data: dict) -> Order:
        items_data = validated_data.pop("items", [])
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

    @transaction.atomic
    def update(self, instance: Order, validated_data: dict) -> Order:
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                OrderItem.objects.create(order=instance, **item)
        return instance
