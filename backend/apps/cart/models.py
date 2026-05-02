from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Корзина"
        verbose_name_plural = "Корзины"

    @property
    def total(self) -> Decimal:
        result = Decimal("0")
        for item in self.items.all():
            result += item.product.sale_price * item.quantity
        return result.quantize(Decimal("0.01"))


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="cart_items"
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("1"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("cart", "product")]
        ordering = ["-added_at"]
