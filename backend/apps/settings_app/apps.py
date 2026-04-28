from django.apps import AppConfig


class SettingsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.settings_app"
    label = "settings_app"
    verbose_name = "Настройки системы"
