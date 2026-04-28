from decimal import Decimal

from django.conf import settings
from django.db import models


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        SENT = "sent", "Отправлен"
        CONFIRMED = "confirmed", "Подтверждён"
        RECEIVED = "received", "Получен"
        CANCELLED = "cancelled", "Отменён"

    number = models.CharField(
        "Номер", max_length=32, unique=True, blank=True, db_index=True,
    )
    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
        verbose_name="Поставщик",
    )
    warehouse = models.ForeignKey(
        "stock.Warehouse",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
        null=True, blank=True,
        verbose_name="Склад приёмки",
    )
    status = models.CharField(
        "Статус", max_length=12, choices=Status.choices, default=Status.DRAFT,
    )
    expected_date = models.DateField("Ожидаемая дата", null=True, blank=True)
    received_date = models.DateField("Дата получения", null=True, blank=True)
    notes = models.TextField("Заметки", blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="purchase_orders",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заявка на закупку"
        verbose_name_plural = "Заявки на закупку"
        indexes = [models.Index(fields=["status"]), models.Index(fields=["-created_at"])]

    def __str__(self) -> str:
        return self.number or f"PO#{self.pk}"

    def save(self, *args, **kwargs) -> None:
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.number:
            self.number = f"PO-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["number"])

    @property
    def total(self) -> Decimal:
        result = Decimal("0")
        for item in self.items.all():
            result += item.quantity * item.price
        return result.quantize(Decimal("0.01"))


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE,
        related_name="items", verbose_name="Заявка",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="purchase_items",
        verbose_name="Товар",
    )
    quantity = models.DecimalField(
        "Количество", max_digits=12, decimal_places=2, default=Decimal("1"),
    )
    price = models.DecimalField(
        "Закуп. цена", max_digits=12, decimal_places=2, default=Decimal("0"),
    )

    class Meta:
        verbose_name = "Позиция закупки"
        verbose_name_plural = "Позиции закупки"

    def __str__(self) -> str:
        return f"{self.product} × {self.quantity}"

    @property
    def sum(self) -> Decimal:
        return (self.quantity * self.price).quantize(Decimal("0.01"))


class PurchasePriceHistory(models.Model):
    """История закупочных цен по поставщикам и товарам."""

    supplier = models.ForeignKey(
        "suppliers.Supplier", on_delete=models.CASCADE,
        related_name="price_history",
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE,
        related_name="purchase_price_history",
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True,
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]
        verbose_name = "История закуп. цены"
        verbose_name_plural = "История закуп. цен"
        indexes = [
            models.Index(fields=["supplier", "product", "-recorded_at"]),
        ]
