from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import Client, ClientInteraction, ClientTag, ClientTask


class ClientInteractionSerializer(serializers.ModelSerializer):
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)

    class Meta:
        model = ClientInteraction
        fields = [
            "id", "client", "channel", "channel_display", "summary",
            "details", "user", "occurred_at", "created_at",
        ]
        read_only_fields = ["created_at"]


class ClientTaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ClientTask
        fields = [
            "id", "client", "title", "description", "due_at", "status",
            "status_display", "assignee", "created_at", "completed_at",
        ]
        read_only_fields = ["created_at"]


class ClientTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientTag
        fields = ["id", "name", "color"]


class ClientSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    segment_display = serializers.CharField(source="get_segment_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    manager_name = serializers.SerializerMethodField()
    ltv = serializers.SerializerMethodField()
    avg_check = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()
    tags = ClientTagSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "type",
            "type_display",
            "inn",
            "phone",
            "email",
            "address",
            "segment",
            "segment_display",
            "status",
            "status_display",
            "manager",
            "manager_name",
            "notes",
            "ltv",
            "avg_check",
            "orders_count",
            "tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_manager_name(self, obj: Client) -> str:
        if obj.manager_id is None:
            return ""
        return obj.manager.get_full_name() or obj.manager.username

    def _orders(self, obj: Client):
        return obj.orders.all()

    def get_ltv(self, obj: Client) -> str:
        total = (
            obj.orders.aggregate(s=Sum("payments__amount"))["s"] or Decimal("0")
        )
        return str(total.quantize(Decimal("0.01")))

    def get_orders_count(self, obj: Client) -> int:
        return obj.orders.count()

    def get_avg_check(self, obj: Client) -> str:
        n = obj.orders.count() or 1
        total = (
            obj.orders.aggregate(s=Sum("payments__amount"))["s"] or Decimal("0")
        )
        return str((total / n).quantize(Decimal("0.01")))
