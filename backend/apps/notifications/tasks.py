"""Celery-таски доставки Web Push."""
from __future__ import annotations

import json
import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = 50  # сколько подписок на одну таску в broadcast'е


@shared_task(name="notifications.send_web_push")
def send_web_push(notification_id: int) -> dict:
    """Шлёт Web Push.

    - Если у уведомления есть `recipient_id` — шлёт всем его подпискам в этой же таске.
    - Если `recipient_id` пустой (broadcast) — разбивает все активные подписки на
      чанки по CHUNK_SIZE и ставит на каждый чанк отдельную таску `_send_chunk`.
    """
    from .models import Notification, PushSubscription

    try:
        notif = Notification.objects.get(pk=notification_id)
    except Notification.DoesNotExist:
        return {"sent": 0, "error": "notification not found"}

    if not getattr(settings, "VAPID_PRIVATE_KEY", ""):
        logger.warning("VAPID_PRIVATE_KEY не задан — Web Push отключён")
        return {"sent": 0, "error": "vapid not configured"}

    payload = _payload(notif)

    if notif.recipient_id:
        ids = list(
            PushSubscription.objects.filter(
                user_id=notif.recipient_id, is_active=True,
            ).values_list("id", flat=True)
        )
        return _push_to_ids(ids, payload)

    # broadcast — на всех активных подписчиков, разбиваем на чанки
    ids = list(
        PushSubscription.objects.filter(is_active=True).values_list("id", flat=True)
    )
    if not ids:
        return {"sent": 0, "queued_chunks": 0}

    chunks = [ids[i : i + CHUNK_SIZE] for i in range(0, len(ids), CHUNK_SIZE)]
    for chunk in chunks:
        _send_chunk.delay(chunk, payload)
    return {"sent": 0, "queued_chunks": len(chunks), "total_subs": len(ids)}


@shared_task(name="notifications._send_chunk")
def _send_chunk(sub_ids: list[int], payload: str) -> dict:
    """Шлёт push на конкретный чанк подписок (вызывается из broadcast)."""
    return _push_to_ids(sub_ids, payload)


def _payload(notif) -> str:
    return json.dumps({
        "title": notif.title,
        "body": notif.body or "",
        "url": notif.url or "/",
        "tag": f"notif-{notif.id}",
    })


def _push_to_ids(sub_ids: list[int], payload: str) -> dict:
    """Низкоуровневая отправка на список подписок. Деактивирует протухшие."""
    from pywebpush import WebPushException, webpush

    from .models import PushSubscription

    private = settings.VAPID_PRIVATE_KEY
    claims_email = getattr(settings, "VAPID_CLAIMS_EMAIL", "mailto:admin@aqualine.tj")

    sent = 0
    deactivate: list[int] = []
    qs = PushSubscription.objects.filter(id__in=sub_ids)

    for sub in qs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=private,
                vapid_claims={"sub": claims_email},
            )
            sent += 1
        except WebPushException as e:
            status = getattr(e.response, "status_code", None) if e.response else None
            if status in (404, 410):
                deactivate.append(sub.id)
            else:
                logger.warning("WebPush error sub=%s: %s", sub.id, e)
        except Exception as e:  # noqa: BLE001
            logger.exception("WebPush unexpected error: %s", e)

    if deactivate:
        PushSubscription.objects.filter(id__in=deactivate).update(is_active=False)

    return {"sent": sent, "deactivated": len(deactivate), "total": len(sub_ids)}
