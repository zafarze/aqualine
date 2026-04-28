from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    autocomplete_fields = ("product",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("number", "client", "status", "manager", "created_at")
    list_filter = ("status", "manager")
    search_fields = ("number", "client__name", "notes")
    autocomplete_fields = ("client", "manager")
    readonly_fields = ("number", "created_at", "updated_at")
    inlines = [OrderItemInline]
