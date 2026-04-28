from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "unit", "sale_price", "stock", "updated_at")
    list_filter = ("unit",)
    search_fields = ("sku", "name")
    readonly_fields = ("created_at", "updated_at")
