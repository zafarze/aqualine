from decimal import Decimal

from django.conf import settings
from django.db import models


class Warehouse(models.Model):
    name = models.CharField("Название", max_length=120, unique=True)
    code = models.CharField("Код", max_length=32, blank=True)
    address = models.TextField("Адрес", blank=True)
    is_active = models.BooleanField("Активен", default=True)
    is_default = models.BooleanField(
        "По умолчанию", default=False,
        help_text="Только один склад может быть по умолчанию",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Склад"
        verbose_name_plural = "Склады"

    def __str__(self) -> str:
        return self.name


class StockMovement(models.Model):
    """История движений товара. Источник правды — суммы по типам.

    `Product.stock` (поле в apps.products) обновляется триггером в signals.py.
    """

    class Type(models.TextChoices):
        IN = "in", "Приход"
        OUT = "out", "Расход"
        TRANSFER = "transfer", "Перемещение"
        INVENTORY = "inventory", "Инвентаризация"
        RESERVE = "reserve", "Резервирование"
        UNRESERVE = "unreserve", "Снятие резерва"
        RETURN = "return", "Возврат"

    type = models.CharField("Тип", max_length=12, choices=Type.choices)
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="movements",
        verbose_name="Товар",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="movements",
        null=True,
        blank=True,
        verbose_name="Склад",
    )
    warehouse_to = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="incoming_movements",
        null=True,
        blank=True,
        verbose_name="Склад-получатель",
        help_text="Только для перемещений",
    )
    quantity = models.DecimalField(
        "Количество", max_digits=14, decimal_places=2,
        help_text="Положительное число; знак определяется типом операции",
    )
    price = models.DecimalField(
        "Цена за ед.", max_digits=12, decimal_places=2,
        default=Decimal("0"),
    )
    reference = models.CharField(
        "Документ-основание", max_length=64, blank=True,
        help_text="Например: PO-2026-0001 или AQ-2026-0042",
    )
    notes = models.TextField("Комментарий", blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="stock_movements",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Движение по складу"
        verbose_name_plural = "Движения по складу"
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["product"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_type_display()} · {self.product} · {self.quantity}"

    @property
    def signed_quantity(self) -> Decimal:
        """Знак движения для пересчёта остатка."""
        if self.type in (self.Type.IN, self.Type.RETURN, self.Type.INVENTORY):
            return self.quantity
        if self.type in (self.Type.OUT, self.Type.RESERVE):
            return -self.quantity
        if self.type == self.Type.UNRESERVE:
            return self.quantity
        return Decimal("0")  # transfer обрабатывается отдельно
