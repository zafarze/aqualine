from rest_framework.routers import DefaultRouter

from .views import (
    BranchViewSet,
    CompanyProfileViewSet,
    CurrencyViewSet,
    ExchangeRateViewSet,
)

router = DefaultRouter()
router.register("company", CompanyProfileViewSet, basename="company-profile")
router.register("branches", BranchViewSet, basename="branch")
router.register("currencies", CurrencyViewSet, basename="currency")
router.register("rates", ExchangeRateViewSet, basename="exchange-rate")

urlpatterns = router.urls
