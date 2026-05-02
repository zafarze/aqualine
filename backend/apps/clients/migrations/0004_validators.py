import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0003_clientinteraction_clienttag_clienttask_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="client",
            name="phone",
            field=models.CharField(
                blank=True,
                max_length=32,
                validators=[
                    django.core.validators.RegexValidator(
                        message="Телефон должен содержать 6–32 символов: цифры, пробелы, +, -, ().",
                        regex="^\\+?[0-9\\s\\-()]{6,32}$",
                    )
                ],
                verbose_name="Телефон",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="inn",
            field=models.CharField(
                blank=True,
                max_length=32,
                validators=[
                    django.core.validators.RegexValidator(
                        message="ИНН должен состоять из 6–20 цифр.",
                        regex="^[0-9]{6,20}$",
                    )
                ],
                verbose_name="ИНН",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="email",
            field=models.EmailField(blank=True, max_length=254, verbose_name="Email"),
        ),
        migrations.AlterField(
            model_name="historicalclient",
            name="phone",
            field=models.CharField(
                blank=True,
                max_length=32,
                validators=[
                    django.core.validators.RegexValidator(
                        message="Телефон должен содержать 6–32 символов: цифры, пробелы, +, -, ().",
                        regex="^\\+?[0-9\\s\\-()]{6,32}$",
                    )
                ],
                verbose_name="Телефон",
            ),
        ),
        migrations.AlterField(
            model_name="historicalclient",
            name="inn",
            field=models.CharField(
                blank=True,
                max_length=32,
                validators=[
                    django.core.validators.RegexValidator(
                        message="ИНН должен состоять из 6–20 цифр.",
                        regex="^[0-9]{6,20}$",
                    )
                ],
                verbose_name="ИНН",
            ),
        ),
        migrations.AlterField(
            model_name="historicalclient",
            name="email",
            field=models.EmailField(blank=True, max_length=254, verbose_name="Email"),
        ),
    ]
