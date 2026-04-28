"""Сериализатор пользователя для djoser-эндпойнтов (/users/, /users/me/)."""
from djoser.serializers import UserSerializer as BaseUserSerializer
from rest_framework import serializers


class UserSerializer(BaseUserSerializer):
    role_display = serializers.CharField(
        source="get_role_display", read_only=True
    )
    full_name = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        fields = tuple(BaseUserSerializer.Meta.fields) + (
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "role_display",
            "phone",
            "photo",
        )
        read_only_fields = (
            BaseUserSerializer.Meta.read_only_fields
            + ("role_display", "full_name")
        )

    def get_full_name(self, obj) -> str:
        full = obj.get_full_name()
        return full or obj.username
