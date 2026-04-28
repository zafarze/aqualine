from rest_framework import serializers

from .models import Branch, CompanyProfile, Currency, ExchangeRate


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = [
            "id", "name", "legal_name", "inn", "kpp", "address", "phone", "email",
            "website", "bank_details", "logo", "default_currency", "tax_rate",
        ]


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "phone", "is_active", "created_at"]
        read_only_fields = ["created_at"]


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ["id", "code", "name", "symbol"]


class ExchangeRateSerializer(serializers.ModelSerializer):
    currency_code = serializers.CharField(source="currency.code", read_only=True)

    class Meta:
        model = ExchangeRate
        fields = ["id", "currency", "currency_code", "rate", "date", "source"]
