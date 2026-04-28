"""Сигналы заказа: автоматические движения по складу при смене статуса.

- → confirmed: RESERVE каждой позиции
- confirmed → cancelled: UNRESERVE
- → shipped: UNRESERVE (если было) + OUT
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.stock.models import StockMovement

from .models import Order


@receiver(pre_save, sender=Order, dispatch_uid="order_capture_prev_status")
def capture_prev_status(sender, instance: Order, **kwargs) -> None:
    if not instance.pk:
        instance._prev_status = None
        return
    try:
        instance._prev_status = (
            Order.objects.only("status").get(pk=instance.pk).status
        )
    except Order.DoesNotExist:
        instance._prev_status = None


@receiver(post_save, sender=Order, dispatch_uid="order_status_stock_hooks")
def order_status_hooks(sender, instance: Order, created: bool, **kwargs) -> None:
    prev = getattr(instance, "_prev_status", None)
    new = instance.status
    if prev == new:
        return

    items = list(instance.items.select_related("product").all())
    if not items:
        return

    if new == Order.Status.CONFIRMED and prev != Order.Status.CONFIRMED:
        for it in items:
            StockMovement.objects.create(
                type=StockMovement.Type.RESERVE,
                product=it.product,
                quantity=it.quantity,
                price=it.price,
                reference=instance.number or f"order-{instance.pk}",
                notes=f"Резерв под заказ {instance.number}",
            )
        return

    if new == Order.Status.SHIPPED:
        was_reserved = prev == Order.Status.CONFIRMED
        for it in items:
            if was_reserved:
                StockMovement.objects.create(
                    type=StockMovement.Type.UNRESERVE,
                    product=it.product,
                    quantity=it.quantity,
                    reference=instance.number or f"order-{instance.pk}",
                    notes=f"Снятие резерва (отгрузка) {instance.number}",
                )
            StockMovement.objects.create(
                type=StockMovement.Type.OUT,
                product=it.product,
                quantity=it.quantity,
                price=it.price,
                reference=instance.number or f"order-{instance.pk}",
                notes=f"Отгрузка по заказу {instance.number}",
            )
        return

    if new == Order.Status.CANCELLED and prev == Order.Status.CONFIRMED:
        for it in items:
            StockMovement.objects.create(
                type=StockMovement.Type.UNRESERVE,
                product=it.product,
                quantity=it.quantity,
                reference=instance.number or f"order-{instance.pk}",
                notes=f"Отмена заказа {instance.number}",
            )
