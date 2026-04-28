from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Супер-администратор"
        DIRECTOR = "director", "Директор"
        ADMIN = "admin", "Администратор"
        MANAGER = "manager", "Менеджер"
        WAREHOUSE = "warehouse", "Кладовщик"
        ACCOUNTANT = "accountant", "Бухгалтер"
        PURCHASER = "purchaser", "Закупщик"
        CLIENT = "client", "Клиент"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MANAGER,
        verbose_name="Роль",
    )
    phone = models.CharField(max_length=32, blank=True, verbose_name="Телефон")
    photo = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
        verbose_name="Фото профиля",
    )

    client_profile = models.ForeignKey(
        "clients.Client",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="portal_users",
        verbose_name="Связанный клиент",
        help_text="Заполняется только для пользователей-клиентов кабинета",
    )

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self) -> str:
        return self.get_full_name() or self.username

    @property
    def is_staff_role(self) -> bool:
        """Сотрудник AquaLine (не клиент кабинета)."""
        return self.role != self.Role.CLIENT

    def has_role(self, *roles: str) -> bool:
        return self.role in roles
