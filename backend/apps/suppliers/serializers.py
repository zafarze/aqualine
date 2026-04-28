from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id", "name", "type", "type_display", "inn", "contact_person",
            "phone", "email", "address", "payment_terms", "rating",
            "is_active", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
