from decimal import Decimal

from django.conf import settings
from django.db import models


class Category(models.Model):
    class Type(models.TextChoices):
        EXPENSE = "expense", "Расход"
        INCOME = "income", "Доход"

    name = models.CharField("Название", max_length=120)
    type = models.CharField(
        "Тип", max_length=10, choices=Type.choices, default=Type.EXPENSE
    )
    color = models.CharField("Цвет", max_length=7, default="#8E7CF8")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["type", "name"]
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        unique_together = [("name", "type")]

    def __str__(self) -> str:
        return f"{self.get_type_display()} · {self.name}"


class Expense(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="expenses",
        verbose_name="Категория",
    )
    amount = models.DecimalField("Сумма", max_digits=14, decimal_places=2)
    date = models.DateField("Дата")
    description = models.CharField("Описание", max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses_created",
        verbose_name="Создал",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Расход"
        verbose_name_plural = "Расходы"
        indexes = [
            models.Index(fields=["-date"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:
        return f"{self.date} · {self.category.name} · {self.amount}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", "Наличные"
        CARD = "card", "Карта"
        TRANSFER = "transfer", "Перевод"
        OTHER = "other", "Прочее"

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Заказ",
    )
    amount = models.DecimalField("Сумма", max_digits=14, decimal_places=2)
    date = models.DateField("Дата")
    method = models.CharField(
        "Метод", max_length=10, choices=Method.choices, default=Method.CASH
    )
    notes = models.CharField("Заметки", max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Оплата"
        verbose_name_plural = "Оплаты"
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["-date"]),
        ]

    def __str__(self) -> str:
        return f"{self.order.number} · {self.amount}"
