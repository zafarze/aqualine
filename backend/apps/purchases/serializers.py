from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.stock.models import StockMovement

from .models import PurchaseOrder, PurchaseOrderItem, PurchasePriceHistory


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    sum = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id", "product", "product_name", "product_sku",
            "quantity", "price", "sum",
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id", "number", "supplier", "supplier_name", "warehouse",
            "status", "status_display", "expected_date", "received_date",
            "notes", "items", "total", "created_at", "updated_at",
        ]
        read_only_fields = ["number", "created_at", "updated_at"]

    @transaction.atomic
    def create(self, validated_data: dict) -> PurchaseOrder:
        items_data = validated_data.pop("items", [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item)
        self._sync_status(po)
        return po

    @transaction.atomic
    def update(self, instance: PurchaseOrder, validated_data: dict) -> PurchaseOrder:
        items_data = validated_data.pop("items", None)
        prev_status = instance.status
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item)
        if prev_status != instance.status:
            self._sync_status(instance)
        return instance

    def _sync_status(self, po: PurchaseOrder) -> None:
        """Когда заявка становится received — создаём приходы и историю цен."""
        if po.status != PurchaseOrder.Status.RECEIVED:
            return
        for item in po.items.select_related("product").all():
            StockMovement.objects.create(
                type=StockMovement.Type.IN,
                product=item.product,
                warehouse=po.warehouse,
                quantity=item.quantity,
                price=item.price,
                reference=po.number,
                notes=f"Приход по {po.number}",
            )
            PurchasePriceHistory.objects.create(
                supplier=po.supplier,
                product=item.product,
                price=item.price,
                purchase_order=po,
            )
            # Обновляем закупочную цену в карточке товара
            if item.price > Decimal("0"):
                item.product.purchase_price = item.price
                item.product.save(update_fields=["purchase_price", "updated_at"])
