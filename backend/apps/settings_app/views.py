from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import CanManageSettings

from .models import Branch, CompanyProfile, Currency, ExchangeRate
from .serializers import (
    BranchSerializer,
    CompanyProfileSerializer,
    CurrencySerializer,
    ExchangeRateSerializer,
)


class CompanyProfileViewSet(viewsets.ModelViewSet):
    queryset = CompanyProfile.objects.all()
    serializer_class = CompanyProfileSerializer
    permission_classes = [CanManageSettings]

    @action(detail=False, methods=["get", "put", "patch"], url_path="current")
    def current(self, request):
        obj = CompanyProfile.load()
        if request.method == "GET":
            return Response(self.get_serializer(obj).data)
        ser = self.get_serializer(obj, data=request.data, partial=request.method == "PATCH")
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [CanManageSettings]
    filterset_fields = ["is_active"]
    search_fields = ["name", "address"]


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [CanManageSettings]
    search_fields = ["code", "name"]


class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.select_related("currency").all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [CanManageSettings]
    filterset_fields = ["currency"]
    ordering_fields = ["date", "rate"]
    ordering = ["-date"]
