from rest_framework import viewsets

from apps.users.permissions import CanManageOrders
from apps.users.scoping import ManagerScopedQuerysetMixin

from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(ManagerScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = (
        Order.objects.select_related("client", "manager")
        .prefetch_related("items__product", "payments")
        .all()
    )
    serializer_class = OrderSerializer
    permission_classes = [CanManageOrders]
    filterset_fields = ["status", "client", "manager"]
    search_fields = ["number", "client__name", "notes"]
    ordering_fields = ["created_at", "due_date", "number"]
    ordering = ["-created_at"]
