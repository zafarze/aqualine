from decimal import Decimal

from django.db import models
from simple_history.models import HistoricalRecords


class Product(models.Model):
    class Unit(models.TextChoices):
        PIECE = "pcs", "шт"
        METER = "m", "м"
        KILOGRAM = "kg", "кг"
        LITER = "l", "л"
        PACK = "pack", "уп"

    sku = models.CharField("Артикул", max_length=64, unique=True)
    name = models.CharField("Наименование", max_length=255)
    unit = models.CharField(
        "Ед. изм.", max_length=10, choices=Unit.choices, default=Unit.PIECE
    )
    purchase_price = models.DecimalField(
        "Закупочная цена", max_digits=12, decimal_places=2, default=Decimal("0")
    )
    sale_price = models.DecimalField(
        "Розничная цена", max_digits=12, decimal_places=2, default=Decimal("0")
    )
    stock = models.DecimalField(
        "Остаток", max_digits=12, decimal_places=2, default=Decimal("0")
    )
    reserved = models.DecimalField(
        "Резерв", max_digits=12, decimal_places=2, default=Decimal("0"),
        help_text="Зарезервировано под подтверждённые заказы",
    )
    min_stock = models.DecimalField(
        "Мин. остаток", max_digits=12, decimal_places=2, default=Decimal("0"),
        help_text="Триггер для уведомления о пополнении",
    )
    barcode = models.CharField(
        "Штрихкод", max_length=64, blank=True, db_index=True,
    )
    image = models.ImageField(
        "Изображение", upload_to="products/", blank=True, null=True,
    )
    is_active = models.BooleanField("Активен", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ["name"]
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        indexes = [models.Index(fields=["sku"])]

    def __str__(self) -> str:
        return f"{self.sku} · {self.name}"
