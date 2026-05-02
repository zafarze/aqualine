"""Row-level доступ: менеджер видит только своё, остальные роли — всё.

Используется как ViewSet mixin. Указывает поле, по которому ограничиваем
queryset для роли MANAGER (по умолчанию — `manager`).
"""
from __future__ import annotations

from rest_framework.exceptions import PermissionDenied

from apps.users.models import User


VISIBILITY_ROLES = {
    User.Role.SUPER_ADMIN,
    User.Role.DIRECTOR,
    User.Role.ADMIN,
    User.Role.ACCOUNTANT,
    User.Role.WAREHOUSE,
    User.Role.PURCHASER,
}


class ManagerScopedQuerysetMixin:
    """Менеджер видит только записи, где `manager_field == request.user`.

    Для прочих ролей фильтрация не применяется. Для клиента кабинета
    queryset обрезается до пустого (доступ к CRM-эндпоинтам им не положен).
    """

    manager_field: str = "manager"

    def get_queryset(self):  # type: ignore[override]
        qs = super().get_queryset()
        user = self.request.user
        if not user or not user.is_authenticated:
            return qs.none()
        if user.is_superuser:
            return qs
        role = getattr(user, "role", None)
        if role == User.Role.MANAGER:
            return qs.filter(**{self.manager_field: user})
        if role == User.Role.CLIENT:
            return qs.none()
        if role in VISIBILITY_ROLES:
            return qs
        return qs.none()

    def perform_create(self, serializer):  # type: ignore[override]
        user = self.request.user
        kwargs = {}
        if (
            getattr(user, "role", None) == User.Role.MANAGER
            and self.manager_field not in serializer.validated_data
        ):
            kwargs[self.manager_field] = user
        serializer.save(**kwargs)

    def perform_update(self, serializer):  # type: ignore[override]
        user = self.request.user
        if getattr(user, "role", None) == User.Role.MANAGER:
            target = serializer.validated_data.get(self.manager_field)
            if target and target != user:
                raise PermissionDenied(
                    "Менеджер не может переназначать запись на другого пользователя."
                )
        serializer.save()
