from decimal import Decimal

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from apps.users.permissions import IsCabinetClient

from .models import Cart, CartItem
from .serializers import CartItemSerializer, CartSerializer


def _get_or_create_cart(user) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartViewSet(viewsets.ViewSet):
    """Серверная корзина клиента кабинета.

    Все операции — над корзиной текущего пользователя; ID корзины не передаётся.
    """

    permission_classes = [IsCabinetClient]

    def list(self, request):
        cart = _get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        product_id = request.data.get("product")
        quantity = Decimal(str(request.data.get("quantity", "1")))
        if quantity <= 0:
            raise ValidationError({"quantity": "Должно быть больше нуля."})
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            raise ValidationError({"product": "Товар не найден."})

        cart = _get_or_create_cart(request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity = item.quantity + quantity
            item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["patch"], url_path=r"items/(?P<item_id>\d+)")
    def update_item(self, request, item_id=None):
        cart = _get_or_create_cart(request.user)
        try:
            item = cart.items.get(pk=item_id)
        except CartItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if "quantity" in request.data:
            qty = Decimal(str(request.data["quantity"]))
            if qty <= 0:
                raise ValidationError({"quantity": "Должно быть больше нуля."})
            item.quantity = qty
            item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data)

    @action(detail=False, methods=["delete"], url_path=r"items/(?P<item_id>\d+)")
    def remove_item(self, request, item_id=None):
        cart = _get_or_create_cart(request.user)
        cart.items.filter(pk=item_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="clear")
    def clear(self, request):
        cart = _get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"], url_path="checkout")
    @transaction.atomic
    def checkout(self, request):
        """Превращает корзину в Order со статусом LEAD."""
        cart = _get_or_create_cart(request.user)
        items = list(cart.items.select_related("product").all())
        if not items:
            raise ValidationError({"detail": "Корзина пуста."})

        client_profile = getattr(request.user, "client_profile", None)
        if client_profile is None:
            raise ValidationError(
                {"detail": "У пользователя не привязан клиентский профиль."}
            )

        order = Order.objects.create(
            client=client_profile,
            status=Order.Status.LEAD,
            notes=request.data.get("notes", ""),
        )
        for it in items:
            OrderItem.objects.create(
                order=order,
                product=it.product,
                quantity=it.quantity,
                price=it.product.sale_price,
                discount=Decimal("0"),
            )
        cart.items.all().delete()
        return Response(
            {"order_id": order.id, "number": order.number},
            status=status.HTTP_201_CREATED,
        )
