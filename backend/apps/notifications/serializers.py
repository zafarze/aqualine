from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "type", "type_display", "tone", "title", "body", "url",
            "is_read", "created_at", "recipient",
        ]
        read_only_fields = ["created_at", "type_display"]
