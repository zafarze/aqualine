from django.conf import settings
from django.db import models


class PushSubscription(models.Model):
    """Web Push подписка браузера. Привязка к пользователю опциональна
    (один user может иметь несколько устройств)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
        null=True, blank=True,
    )
    endpoint = models.URLField("Endpoint", max_length=512, unique=True)
    p256dh = models.CharField("Public key (p256dh)", max_length=255)
    auth = models.CharField("Auth secret", max_length=255)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Push-подписка"
        verbose_name_plural = "Push-подписки"

    def __str__(self) -> str:
        return f"{self.user_id or 'anon'} · {self.endpoint[:40]}…"


class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_ORDER = "new_order", "Новый заказ"
        PAYMENT = "payment", "Оплата"
        LOW_STOCK = "low_stock", "Низкий остаток"
        OVERDUE = "overdue", "Просроченная оплата"
        TASK = "task", "Задача"
        SYSTEM = "system", "Системное"

    class Tone(models.TextChoices):
        INFO = "info", "Инфо"
        SUCCESS = "success", "Успех"
        WARNING = "warning", "Предупреждение"
        DANGER = "danger", "Критично"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True, blank=True,
        help_text="null = широковещательное (для всех сотрудников)",
    )
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    tone = models.CharField(max_length=10, choices=Tone.choices, default=Tone.INFO)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    url = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self) -> str:
        return self.title
