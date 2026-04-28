"""Сигналы создания уведомлений."""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification


@receiver(post_save, sender=Notification, dispatch_uid="notif_dispatch_push")
def dispatch_push(sender, instance: Notification, created: bool, **kwargs) -> None:
    if not created:
        return
    try:
        from .tasks import send_web_push
        send_web_push.delay(instance.id)
    except Exception:
        # Если Celery/Redis недоступны — не валим запрос пользователя
        pass


@receiver(post_save, sender="orders.Order", dispatch_uid="notif_new_order")
def on_order_created(sender, instance, created, **kwargs) -> None:
    if not created:
        return
    Notification.objects.create(
        type=Notification.Type.NEW_ORDER,
        tone=Notification.Tone.INFO,
        title=f"Новый заказ {instance.number or '#'}",
        body=f"Клиент: {instance.client.name}",
        url=f"/orders/{instance.id}",
    )


@receiver(post_save, sender="finance.Payment", dispatch_uid="notif_payment")
def on_payment_created(sender, instance, created, **kwargs) -> None:
    if not created:
        return
    Notification.objects.create(
        type=Notification.Type.PAYMENT,
        tone=Notification.Tone.SUCCESS,
        title=f"Оплата {instance.amount}",
        body=f"Заказ {instance.order.number}",
        url=f"/orders/{instance.order_id}",
    )


@receiver(post_save, sender="products.Product", dispatch_uid="notif_low_stock")
def on_product_low_stock(sender, instance, created, **kwargs) -> None:
    """Стреляет, когда остаток уходит на/ниже минимального."""
    try:
        min_stock = instance.min_stock or 0
    except AttributeError:
        return
    if instance.stock is None:
        return
    if instance.stock <= min_stock and instance.stock > 0:
        # idempotency: не плодим дубликаты — проверяем, есть ли свежее
        recent = Notification.objects.filter(
            type=Notification.Type.LOW_STOCK,
            url=f"/products/{instance.id}",
            is_read=False,
        ).exists()
        if recent:
            return
        Notification.objects.create(
            type=Notification.Type.LOW_STOCK,
            tone=Notification.Tone.WARNING,
            title=f"Низкий остаток: {instance.name}",
            body=f"Текущий: {instance.stock}, минимум: {min_stock}",
            url=f"/products/{instance.id}",
        )
