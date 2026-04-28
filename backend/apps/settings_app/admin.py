from django.contrib import admin

from .models import Branch, CompanyProfile, Currency, ExchangeRate


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "inn", "default_currency")


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "is_active")
    list_filter = ("is_active",)


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "symbol")


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ("date", "currency", "rate", "source")
    list_filter = ("currency",)
    date_hierarchy = "date"
