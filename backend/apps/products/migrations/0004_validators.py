from decimal import Decimal

import django.core.validators
from django.db import migrations, models


NON_NEGATIVE_FIELDS = ["purchase_price", "sale_price", "stock", "reserved", "min_stock"]


def _decimal_field(verbose_name, help_text=""):
    kwargs = dict(
        decimal_places=2,
        default=Decimal("0"),
        max_digits=12,
        validators=[django.core.validators.MinValueValidator(Decimal("0"))],
        verbose_name=verbose_name,
    )
    if help_text:
        kwargs["help_text"] = help_text
    return models.DecimalField(**kwargs)


FIELD_DEFS = {
    "purchase_price": _decimal_field("Закупочная цена"),
    "sale_price": _decimal_field("Розничная цена"),
    "stock": _decimal_field("Остаток"),
    "reserved": _decimal_field("Резерв", "Зарезервировано под подтверждённые заказы"),
    "min_stock": _decimal_field("Мин. остаток", "Триггер для уведомления о пополнении"),
}


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0003_historicalproduct_reserved_product_reserved"),
    ]

    operations = [
        migrations.AlterField(model_name="product", name=name, field=field)
        for name, field in FIELD_DEFS.items()
    ] + [
        migrations.AlterField(model_name="historicalproduct", name=name, field=field)
        for name, field in FIELD_DEFS.items()
    ]
