from decimal import Decimal

from django.conf import settings
from django.db import models
from simple_history.models import HistoricalRecords


class Order(models.Model):
    class Status(models.TextChoices):
        LEAD = "lead", "Заявка"
        QUOTED = "quoted", "Предложение"
        CONFIRMED = "confirmed", "Подтверждён"
        SHIPPED = "shipped", "Отгружен"
        PAID = "paid", "Оплачен"
        CANCELLED = "cancelled", "Отменён"

    number = models.CharField(
        "Номер", max_length=32, unique=True, blank=True, db_index=True
    )
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="Клиент",
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="Менеджер",
    )
    status = models.CharField(
        "Статус", max_length=20, choices=Status.choices, default=Status.LEAD
    )
    due_date = models.DateField("Срок", null=True, blank=True)
    notes = models.TextField("Заметки", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self) -> str:
        return self.number or f"#{self.pk}"

    def save(self, *args, **kwargs) -> None:
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.number:
            self.number = f"AQ-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["number"])

    @property
    def total(self) -> Decimal:
        result = Decimal("0")
        for item in self.items.all():
            gross = item.quantity * item.price
            net = gross * (Decimal("100") - item.discount) / Decimal("100")
            result += net
        return result.quantize(Decimal("0.01"))


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name="Заказ"
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name="Товар",
    )
    quantity = models.DecimalField(
        "Количество", max_digits=12, decimal_places=2, default=Decimal("1")
    )
    price = models.DecimalField(
        "Цена", max_digits=12, decimal_places=2, default=Decimal("0")
    )
    discount = models.DecimalField(
        "Скидка %", max_digits=5, decimal_places=2, default=Decimal("0")
    )

    class Meta:
        verbose_name = "Позиция заказа"
        verbose_name_plural = "Позиции заказа"

    def __str__(self) -> str:
        return f"{self.product} × {self.quantity}"

    @property
    def sum(self) -> Decimal:
        gross = self.quantity * self.price
        net = gross * (Decimal("100") - self.discount) / Decimal("100")
        return net.quantize(Decimal("0.01"))
