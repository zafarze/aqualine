from django.db import models
from simple_history.models import HistoricalRecords


class Supplier(models.Model):
    class Type(models.TextChoices):
        LEGAL = "legal", "Юр. лицо"
        PHYSICAL = "physical", "Физ. лицо"
        ENTREPRENEUR = "entrepreneur", "ИП"

    name = models.CharField("Наименование", max_length=255)
    type = models.CharField(
        "Тип", max_length=20, choices=Type.choices, default=Type.LEGAL
    )
    inn = models.CharField("ИНН", max_length=32, blank=True)
    contact_person = models.CharField("Контактное лицо", max_length=120, blank=True)
    phone = models.CharField("Телефон", max_length=32, blank=True)
    email = models.EmailField("Email", blank=True)
    address = models.TextField("Адрес", blank=True)
    payment_terms = models.CharField(
        "Условия оплаты", max_length=120, blank=True,
        help_text="Например: предоплата 50% + 50% по факту, отсрочка 30 дней",
    )
    rating = models.PositiveSmallIntegerField("Рейтинг", default=0)
    is_active = models.BooleanField("Активен", default=True)
    notes = models.TextField("Заметки", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ["name"]
        verbose_name = "Поставщик"
        verbose_name_plural = "Поставщики"
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name
