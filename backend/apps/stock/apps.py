from django.apps import AppConfig


class StockConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.stock"
    verbose_name = "Склад"

    def ready(self) -> None:
        from . import signals  # noqa: F401
