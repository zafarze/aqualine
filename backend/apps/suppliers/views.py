from rest_framework import viewsets

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filterset_fields = ["type", "is_active"]
    search_fields = ["name", "inn", "contact_person", "phone", "email"]
    ordering_fields = ["name", "rating", "created_at"]
    ordering = ["name"]
