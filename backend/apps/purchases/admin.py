from django.contrib import admin

from .models import PurchaseOrder, PurchaseOrderItem, PurchasePriceHistory


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    autocomplete_fields = ("product",)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("number", "supplier", "status", "expected_date", "created_at")
    list_filter = ("status",)
    search_fields = ("number", "supplier__name")
    inlines = [PurchaseOrderItemInline]
    autocomplete_fields = ("supplier", "warehouse")
    date_hierarchy = "created_at"


@admin.register(PurchasePriceHistory)
class PurchasePriceHistoryAdmin(admin.ModelAdmin):
    list_display = ("recorded_at", "supplier", "product", "price")
    list_filter = ("supplier",)
    search_fields = ("product__name", "product__sku")
    date_hierarchy = "recorded_at"
