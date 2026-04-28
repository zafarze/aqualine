from django.contrib import admin

from .models import Client, ClientInteraction, ClientTag, ClientTask


@admin.register(ClientInteraction)
class ClientInteractionAdmin(admin.ModelAdmin):
    list_display = ("occurred_at", "client", "channel", "summary", "user")
    list_filter = ("channel",)
    search_fields = ("summary", "details", "client__name")
    autocomplete_fields = ("client", "user")


@admin.register(ClientTask)
class ClientTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "status", "due_at", "assignee")
    list_filter = ("status",)
    search_fields = ("title", "description", "client__name")
    autocomplete_fields = ("client", "assignee")


@admin.register(ClientTag)
class ClientTagAdmin(admin.ModelAdmin):
    list_display = ("name", "color")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "segment", "status", "manager", "created_at")
    list_filter = ("type", "segment", "status", "manager")
    search_fields = ("name", "inn", "phone", "email")
    autocomplete_fields = ("manager",)
    list_select_related = ("manager",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("name", "type", "inn")}),
        ("Контакты", {"fields": ("phone", "email", "address")}),
        ("Сегментация", {"fields": ("segment", "status", "manager")}),
        ("Дополнительно", {"fields": ("notes", "created_at", "updated_at")}),
    )
