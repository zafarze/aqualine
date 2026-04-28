from django.contrib import admin

from .models import Category, Expense, Payment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "color")
    list_filter = ("type",)
    search_fields = ("name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("date", "category", "amount", "description", "created_by")
    list_filter = ("category",)
    search_fields = ("description",)
    autocomplete_fields = ("category", "created_by")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "date"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("date", "order", "amount", "method")
    list_filter = ("method",)
    search_fields = ("order__number", "notes")
    autocomplete_fields = ("order",)
    readonly_fields = ("created_at",)
    date_hierarchy = "date"
