from rest_framework import viewsets

from apps.users.permissions import CanManageProducts

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [CanManageProducts]
    filterset_fields = ["unit"]
    search_fields = ["sku", "name"]
    ordering_fields = ["name", "sku", "sale_price", "stock", "created_at"]
    ordering = ["name"]
