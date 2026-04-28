from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "phone", "is_active", "rating")
    list_filter = ("type", "is_active")
    search_fields = ("name", "inn", "phone", "email")
