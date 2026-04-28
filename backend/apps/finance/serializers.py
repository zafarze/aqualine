from rest_framework import serializers

from .models import Category, Expense, Payment


class CategorySerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "type", "type_display", "color", "created_at"]
        read_only_fields = ["created_at"]


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "id",
            "category",
            "category_name",
            "category_color",
            "amount",
            "date",
            "description",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def get_created_by_name(self, obj: Expense) -> str:
        if obj.created_by_id is None:
            return ""
        return obj.created_by.get_full_name() or obj.created_by.username


class PaymentSerializer(serializers.ModelSerializer):
    method_display = serializers.CharField(source="get_method_display", read_only=True)
    order_number = serializers.CharField(source="order.number", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "order_number",
            "amount",
            "date",
            "method",
            "method_display",
            "notes",
            "created_at",
        ]
        read_only_fields = ["created_at"]
