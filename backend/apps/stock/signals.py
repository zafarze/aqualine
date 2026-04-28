"""Сигналы склада: пересчёт Product.stock / Product.reserved по StockMovement."""
from decimal import Decimal

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import StockMovement


@receiver(post_save, sender=StockMovement, dispatch_uid="stock_movement_apply")
def apply_movement(sender, instance: StockMovement, created: bool, **kwargs) -> None:
    if not created:
        return
    product = instance.product

    if instance.type == StockMovement.Type.TRANSFER:
        return  # перемещение не меняет общий остаток

    qty = instance.quantity or Decimal("0")
    if qty == 0:
        return

    # RESERVE/UNRESERVE — только резерв
    if instance.type == StockMovement.Type.RESERVE:
        product.reserved = (product.reserved or Decimal("0")) + qty
        product.save(update_fields=["reserved", "updated_at"])
        return
    if instance.type == StockMovement.Type.UNRESERVE:
        product.reserved = max(
            Decimal("0"), (product.reserved or Decimal("0")) - qty
        )
        product.save(update_fields=["reserved", "updated_at"])
        return

    # IN/RETURN/INVENTORY — увеличивают, OUT — уменьшает
    if instance.type in (
        StockMovement.Type.IN,
        StockMovement.Type.RETURN,
        StockMovement.Type.INVENTORY,
    ):
        delta = qty
    elif instance.type == StockMovement.Type.OUT:
        delta = -qty
    else:
        return

    product.stock = (product.stock or Decimal("0")) + delta
    product.save(update_fields=["stock", "updated_at"])
