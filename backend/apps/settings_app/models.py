from decimal import Decimal

from django.db import models


class CompanyProfile(models.Model):
    """Singleton — реквизиты компании AquaLine."""

    name = models.CharField("Название компании", max_length=255, default="AquaLine")
    legal_name = models.CharField("Юр. наименование", max_length=255, blank=True)
    inn = models.CharField("ИНН", max_length=32, blank=True)
    kpp = models.CharField("КПП", max_length=32, blank=True)
    address = models.TextField("Юр. адрес", blank=True)
    phone = models.CharField("Телефон", max_length=32, blank=True)
    email = models.EmailField("Email", blank=True)
    website = models.URLField("Сайт", blank=True)
    bank_details = models.TextField("Банковские реквизиты", blank=True)
    logo = models.ImageField("Логотип", upload_to="company/", blank=True, null=True)
    default_currency = models.CharField(
        "Валюта по умолчанию", max_length=3, default="TJS",
    )
    tax_rate = models.DecimalField(
        "Ставка налога %", max_digits=5, decimal_places=2, default=Decimal("0"),
    )

    class Meta:
        verbose_name = "Профиль компании"
        verbose_name_plural = "Профиль компании"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        # Singleton — pk всегда 1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls) -> "CompanyProfile":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Branch(models.Model):
    name = models.CharField("Название", max_length=120, unique=True)
    address = models.TextField("Адрес", blank=True)
    phone = models.CharField("Телефон", max_length=32, blank=True)
    is_active = models.BooleanField("Активен", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Филиал"
        verbose_name_plural = "Филиалы"

    def __str__(self) -> str:
        return self.name


class Currency(models.Model):
    code = models.CharField("Код", max_length=3, unique=True)
    name = models.CharField("Название", max_length=64)
    symbol = models.CharField("Символ", max_length=8, blank=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Валюта"
        verbose_name_plural = "Валюты"

    def __str__(self) -> str:
        return f"{self.code} ({self.name})"


class ExchangeRate(models.Model):
    currency = models.ForeignKey(
        Currency, on_delete=models.CASCADE, related_name="rates",
    )
    rate = models.DecimalField(
        "Курс к TJS", max_digits=14, decimal_places=4,
    )
    date = models.DateField("Дата")
    source = models.CharField("Источник", max_length=64, blank=True)

    class Meta:
        ordering = ["-date"]
        unique_together = [("currency", "date")]
        verbose_name = "Курс валюты"
        verbose_name_plural = "Курсы валют"

    def __str__(self) -> str:
        return f"{self.currency.code} · {self.date} · {self.rate}"
