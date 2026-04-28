"""DRF-permission классы по ролям AquaLine.

Маппинг ролей и доступа основан на разделе 3 ТЗ.
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission

User_Role = {
    "SUPER_ADMIN": "super_admin",
    "DIRECTOR": "director",
    "ADMIN": "admin",
    "MANAGER": "manager",
    "WAREHOUSE": "warehouse",
    "ACCOUNTANT": "accountant",
    "PURCHASER": "purchaser",
    "CLIENT": "client",
}


class HasRole(BasePermission):
    """Базовый класс — наследники указывают `allowed_roles`."""

    allowed_roles: tuple[str, ...] = ()
    read_only_roles: tuple[str, ...] = ()

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        role = getattr(user, "role", None)
        if role in self.allowed_roles:
            return True
        if request.method in SAFE_METHODS and role in self.read_only_roles:
            return True
        return False


class IsStaffRole(BasePermission):
    """Любой сотрудник AquaLine, кроме клиентов кабинета."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, "role", None) != "client" or user.is_superuser


class IsCabinetClient(BasePermission):
    """Только пользователь-клиент кабинета."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, "role", None) == "client"


class CanManageProducts(HasRole):
    allowed_roles = ("super_admin", "admin", "warehouse", "purchaser")
    read_only_roles = ("director", "manager", "accountant")


class CanManageOrders(HasRole):
    allowed_roles = ("super_admin", "admin", "manager")
    read_only_roles = ("director", "accountant", "warehouse")


class CanManageFinance(HasRole):
    allowed_roles = ("super_admin", "admin", "accountant")
    read_only_roles = ("director",)


class CanManageStock(HasRole):
    allowed_roles = ("super_admin", "admin", "warehouse")
    read_only_roles = ("director", "manager", "purchaser")


class CanManagePurchases(HasRole):
    allowed_roles = ("super_admin", "admin", "purchaser")
    read_only_roles = ("director", "warehouse", "accountant")


class CanManageSettings(HasRole):
    allowed_roles = ("super_admin", "admin")
    read_only_roles = ("director",)
