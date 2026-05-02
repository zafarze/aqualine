from rest_framework import viewsets

from apps.users.permissions import CanManagePurchases

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [CanManagePurchases]
    filterset_fields = ["type", "is_active"]
    search_fields = ["name", "inn", "contact_person", "phone", "email"]
    ordering_fields = ["name", "rating", "created_at"]
    ordering = ["name"]
