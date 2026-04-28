from django.conf import settings
from django.db import models
from simple_history.models import HistoricalRecords


class Client(models.Model):
    class Type(models.TextChoices):
        PHYSICAL = "physical", "Физическое лицо"
        LEGAL = "legal", "Юридическое лицо"
        ENTREPRENEUR = "entrepreneur", "ИП"

    class Segment(models.TextChoices):
        RETAIL = "retail", "Розница"
        B2B = "b2b", "B2B"
        DEALER = "dealer", "Дилер"
        OTHER = "other", "Прочее"

    class Status(models.TextChoices):
        LEAD = "lead", "Лид"
        ACTIVE = "active", "Активный"
        VIP = "vip", "VIP"
        BLOCKED = "blocked", "Заблокирован"

    name = models.CharField("Наименование", max_length=255)
    type = models.CharField(
        "Тип", max_length=20, choices=Type.choices, default=Type.PHYSICAL
    )
    inn = models.CharField("ИНН", max_length=32, blank=True)
    phone = models.CharField("Телефон", max_length=32, blank=True)
    email = models.EmailField("Email", blank=True)
    address = models.TextField("Адрес", blank=True)
    segment = models.CharField(
        "Сегмент", max_length=20, choices=Segment.choices, default=Segment.RETAIL
    )
    status = models.CharField(
        "Статус", max_length=20, choices=Status.choices, default=Status.LEAD
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clients",
        verbose_name="Менеджер",
    )
    notes = models.TextField("Заметки", blank=True)
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлён", auto_now=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"
        indexes = [
            models.Index(fields=["segment"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self) -> str:
        return self.name


class ClientInteraction(models.Model):
    """История контактов с клиентом: звонки, встречи, переписка."""

    class Channel(models.TextChoices):
        CALL = "call", "Звонок"
        MEETING = "meeting", "Встреча"
        EMAIL = "email", "Email"
        MESSENGER = "messenger", "Мессенджер"
        OTHER = "other", "Прочее"

    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="interactions",
    )
    channel = models.CharField(max_length=12, choices=Channel.choices)
    summary = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="client_interactions",
    )
    occurred_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]
        verbose_name = "Взаимодействие"
        verbose_name_plural = "Взаимодействия"


class ClientTask(models.Model):
    """Задачи и напоминания по клиентам."""

    class Status(models.TextChoices):
        OPEN = "open", "Открыта"
        DONE = "done", "Выполнена"
        CANCELLED = "cancelled", "Отменена"

    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.OPEN,
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="client_tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Задача"
        verbose_name_plural = "Задачи"


class ClientTag(models.Model):
    name = models.CharField(max_length=64, unique=True)
    color = models.CharField(max_length=7, default="#8E7CF8")
    clients = models.ManyToManyField(Client, related_name="tags", blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Тег клиента"
        verbose_name_plural = "Теги клиентов"

    def __str__(self) -> str:
        return self.name
