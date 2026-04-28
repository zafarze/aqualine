from django.http import HttpResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from apps.orders.models import Order

from .pdf import DOCUMENT_TITLES, render_order_document


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_document(request, order_id: int, kind: str):
    if kind not in DOCUMENT_TITLES:
        raise Http404("Неизвестный тип документа")
    try:
        order = (
            Order.objects.select_related("client")
            .prefetch_related("items__product")
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        raise Http404("Заказ не найден")
    pdf_bytes = render_order_document(order, kind)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="{kind}-{order.number}.pdf"'
    )
    return response
