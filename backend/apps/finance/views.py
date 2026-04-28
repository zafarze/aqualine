from rest_framework import viewsets

from apps.users.permissions import CanManageFinance

from .models import Category, Expense, Payment
from .serializers import CategorySerializer, ExpenseSerializer, PaymentSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [CanManageFinance]
    filterset_fields = ["type"]
    search_fields = ["name"]
    ordering_fields = ["name", "type", "created_at"]
    ordering = ["type", "name"]


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("category", "created_by").all()
    serializer_class = ExpenseSerializer
    permission_classes = [CanManageFinance]
    filterset_fields = ["category"]
    search_fields = ["description"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]

    def perform_create(self, serializer: ExpenseSerializer) -> None:
        serializer.save(created_by=self.request.user)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("order").all()
    serializer_class = PaymentSerializer
    permission_classes = [CanManageFinance]
    filterset_fields = ["order", "method"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]
