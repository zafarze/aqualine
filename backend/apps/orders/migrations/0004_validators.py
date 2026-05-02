from decimal import Decimal

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0003_historicalorder"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orderitem",
            name="quantity",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("1"),
                max_digits=12,
                validators=[django.core.validators.MinValueValidator(Decimal("0.01"))],
                verbose_name="Количество",
            ),
        ),
        migrations.AlterField(
            model_name="orderitem",
            name="price",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                max_digits=12,
                validators=[django.core.validators.MinValueValidator(Decimal("0"))],
                verbose_name="Цена",
            ),
        ),
        migrations.AlterField(
            model_name="orderitem",
            name="discount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                max_digits=5,
                validators=[
                    django.core.validators.MinValueValidator(Decimal("0")),
                    django.core.validators.MaxValueValidator(Decimal("100")),
                ],
                verbose_name="Скидка %",
            ),
        ),
    ]
