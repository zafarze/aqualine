from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.none()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["type", "tone", "is_read"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        user = self.request.user
        return Notification.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True)
        ).order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"ok": True})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})


@api_view(["GET"])
@permission_classes([AllowAny])
def vapid_public_key(request: Request) -> Response:
    """Возвращает публичный VAPID-ключ для подписки на пуши."""
    return Response({"public_key": getattr(settings, "VAPID_PUBLIC_KEY", "")})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def push_subscribe(request: Request) -> Response:
    """Сохраняет/обновляет push-подписку текущего пользователя."""
    data = request.data
    endpoint = (data.get("endpoint") or "").strip()
    keys = data.get("keys") or {}
    p256dh = (keys.get("p256dh") or "").strip()
    auth = (keys.get("auth") or "").strip()
    if not (endpoint and p256dh and auth):
        return Response(
            {"error": "endpoint, keys.p256dh, keys.auth обязательны"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    sub, _ = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            "user": request.user,
            "p256dh": p256dh,
            "auth": auth,
            "user_agent": (request.META.get("HTTP_USER_AGENT") or "")[:255],
            "is_active": True,
            "last_used_at": timezone.now(),
        },
    )
    return Response({"id": sub.id, "ok": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def push_unsubscribe(request: Request) -> Response:
    endpoint = (request.data.get("endpoint") or "").strip()
    if not endpoint:
        return Response({"error": "endpoint required"}, status=400)
    PushSubscription.objects.filter(endpoint=endpoint).update(is_active=False)
    return Response({"ok": True})
