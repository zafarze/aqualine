"""Корневая маршрутизация AquaLine CRM."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT auth — explicit routes (не полагаемся на djoser.urls.jwt).
    path(
        "api/auth/jwt/create/",
        TokenObtainPairView.as_view(),
        name="jwt-create",
    ),
    path(
        "api/auth/jwt/refresh/",
        TokenRefreshView.as_view(),
        name="jwt-refresh",
    ),
    path(
        "api/auth/jwt/verify/",
        TokenVerifyView.as_view(),
        name="jwt-verify",
    ),

    # Djoser — управление пользователями (/users/, /users/me/, /users/set_password/, ...).
    path("api/auth/", include("djoser.urls")),

    # Бизнес-модули.
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/clients/", include("apps.clients.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/finance/", include("apps.finance.urls")),
    path("api/suppliers/", include("apps.suppliers.urls")),
    path("api/purchases/", include("apps.purchases.urls")),
    path("api/stock/", include("apps.stock.urls")),
    path("api/settings/", include("apps.settings_app.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/documents/", include("apps.documents.urls")),
    path("api/cart/", include("apps.cart.urls")),

    # Документация API.
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
