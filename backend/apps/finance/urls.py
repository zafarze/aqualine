from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ExpenseViewSet, PaymentViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="finance-category")
router.register("expenses", ExpenseViewSet, basename="finance-expense")
router.register("payments", PaymentViewSet, basename="finance-payment")

urlpatterns = router.urls
