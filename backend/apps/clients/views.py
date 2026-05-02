from rest_framework import viewsets

from apps.users.scoping import ManagerScopedQuerysetMixin

from .models import Client, ClientInteraction, ClientTag, ClientTask
from .serializers import (
    ClientInteractionSerializer,
    ClientSerializer,
    ClientTagSerializer,
    ClientTaskSerializer,
)


class ClientViewSet(ManagerScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Client.objects.select_related("manager").prefetch_related("tags").all()
    serializer_class = ClientSerializer
    filterset_fields = ["type", "segment", "status", "manager"]
    search_fields = ["name", "inn", "phone", "email"]
    ordering_fields = ["created_at", "name", "updated_at"]
    ordering = ["-created_at"]


class ClientInteractionViewSet(viewsets.ModelViewSet):
    queryset = ClientInteraction.objects.select_related("client", "user").all()
    serializer_class = ClientInteractionSerializer
    filterset_fields = ["client", "channel", "user"]
    ordering_fields = ["occurred_at", "created_at"]
    ordering = ["-occurred_at"]

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user if self.request.user.is_authenticated else None
        )


class ClientTaskViewSet(viewsets.ModelViewSet):
    queryset = ClientTask.objects.select_related("client", "assignee").all()
    serializer_class = ClientTaskSerializer
    filterset_fields = ["client", "status", "assignee"]
    ordering_fields = ["due_at", "created_at"]
    ordering = ["-created_at"]


class ClientTagViewSet(viewsets.ModelViewSet):
    queryset = ClientTag.objects.all()
    serializer_class = ClientTagSerializer
    search_fields = ["name"]
