from django.contrib import admin

from .models import StockMovement, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active", "is_default")
    list_filter = ("is_active", "is_default")
    search_fields = ("name", "code")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("created_at", "type", "product", "quantity", "warehouse", "reference")
    list_filter = ("type", "warehouse")
    search_fields = ("product__name", "product__sku", "reference")
    autocomplete_fields = ("product", "warehouse", "warehouse_to", "created_by")
    date_hierarchy = "created_at"
