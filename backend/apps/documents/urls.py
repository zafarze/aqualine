from django.urls import path

from .views import order_document

urlpatterns = [
    path("orders/<int:order_id>/<str:kind>/", order_document, name="order-document"),
]
