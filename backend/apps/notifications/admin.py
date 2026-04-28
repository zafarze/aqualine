from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("created_at", "type", "tone", "title", "recipient", "is_read")
    list_filter = ("type", "tone", "is_read")
    search_fields = ("title", "body")
    date_hierarchy = "created_at"
