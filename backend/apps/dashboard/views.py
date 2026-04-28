"""Реальный дашборд: агрегации + дельты + воронка + топы + уведомления."""
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, F, Sum
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.clients.models import Client
from apps.finance.models import Expense, Payment
from apps.orders.models import Order, OrderItem
from apps.products.models import Product

LOW_STOCK_THRESHOLD = Decimal("5")
NOTIFICATION_HOURS = 48

SEGMENT_LABEL = {
    "retail": "Розница",
    "b2b": "B2B",
    "dealer": "Дилер",
    "other": "Прочее",
}
SEGMENT_COLOR = {
    "retail": "#8E7CF8",
    "b2b": "#5DD9A8",
    "dealer": "#FF6B9D",
    "other": "#F5C24A",
}
FUNNEL_ORDER = ["lead", "quoted", "confirmed", "shipped", "paid"]
FUNNEL_LABEL = {
    "lead": "Заявка",
    "quoted": "Предложение",
    "confirmed": "Подтверждён",
    "shipped": "Отгружен",
    "paid": "Оплачен",
}
FUNNEL_COLOR = {
    "lead": "#F5C24A",
    "quoted": "#A78BFA",
    "confirmed": "#8E7CF8",
    "shipped": "#34D399",
    "paid": "#10B981",
}
PLAN_TARGET = Decimal("100000")


def _period_start(period: str) -> date:
    today = timezone.now().date()
    if period == "year":
        return today.replace(month=1, day=1)
    if period == "all":
        return date(2000, 1, 1)
    return today.replace(day=1)


def _f(value) -> float:
    if value is None:
        return 0.0
    return float(value)


def _pct_change(curr: Decimal, prev: Decimal) -> float | None:
    """% изменения. None если предыдущее = 0 (нет базы для сравнения)."""
    if prev == 0:
        return None
    return round(float((curr - prev) / prev * 100), 1)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpi(request: Request) -> Response:
    period = request.query_params.get("period", "month")
    start = _period_start(period)
    today = timezone.now().date()

    # Предыдущий период такой же длины — для расчёта дельт
    period_days = max((today - start).days + 1, 1)
    prev_start = start - timedelta(days=period_days)
    prev_end = start - timedelta(days=1)

    # ─── Текущий период ────────────────────────────────────────────────────
    payments_qs = Payment.objects.filter(date__gte=start, date__lte=today)
    expenses_qs = Expense.objects.filter(date__gte=start, date__lte=today)
    orders_qs = Order.objects.filter(created_at__date__gte=start)

    total_sales = payments_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    total_expenses = expenses_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    net_profit = total_sales - total_expenses

    orders_count = orders_qs.count()
    leads = orders_qs.filter(status="lead").count()
    in_progress = orders_qs.filter(
        status__in=["quoted", "confirmed", "shipped"]
    ).count()
    paid = orders_qs.filter(status="paid").count()

    plan_completion = (
        min(100, int((total_sales / PLAN_TARGET) * 100))
        if PLAN_TARGET > 0
        else 0
    )
    deal_conversion = int((paid / orders_count) * 100) if orders_count else 0

    # ─── Предыдущий период (для дельт) ─────────────────────────────────────
    prev_sales = (
        Payment.objects.filter(date__gte=prev_start, date__lte=prev_end).aggregate(
            s=Sum("amount")
        )["s"]
        or Decimal("0")
    )
    prev_orders_count = Order.objects.filter(
        created_at__date__gte=prev_start, created_at__date__lte=prev_end
    ).count()
    prev_paid = Order.objects.filter(
        created_at__date__gte=prev_start,
        created_at__date__lte=prev_end,
        status="paid",
    ).count()
    prev_conversion = (
        int((prev_paid / prev_orders_count) * 100) if prev_orders_count else 0
    )

    deltas = {
        "sales": _pct_change(total_sales, prev_sales),
        "orders": _pct_change(
            Decimal(orders_count), Decimal(prev_orders_count)
        ),
        "conversion": _pct_change(
            Decimal(deal_conversion), Decimal(prev_conversion)
        ),
    }

    # ─── Воронка сделок (без cancelled) ────────────────────────────────────
    funnel_counts = dict(
        orders_qs.values_list("status").annotate(c=Count("id"))
    )
    funnel = [
        {
            "status": s,
            "label": FUNNEL_LABEL[s],
            "count": funnel_counts.get(s, 0),
            "color": FUNNEL_COLOR[s],
        }
        for s in FUNNEL_ORDER
    ]

    # ─── Топ-5 клиентов по оплатам в периоде ───────────────────────────────
    top_clients_qs = (
        Client.objects.filter(
            orders__payments__date__gte=start,
            orders__payments__date__lte=today,
        )
        .annotate(
            paid=Sum("orders__payments__amount"),
            orders_n=Count("orders", distinct=True),
        )
        .order_by("-paid")[:5]
    )
    top_clients = [
        {
            "id": c.id,
            "name": c.name,
            "amount": _f(c.paid),
            "orders": c.orders_n,
        }
        for c in top_clients_qs
    ]

    # ─── Топ-5 товаров (по количеству) ─────────────────────────────────────
    top = (
        OrderItem.objects.filter(order__created_at__date__gte=start)
        .values("product__name")
        .annotate(qty=Sum("quantity"))
        .order_by("-qty")[:5]
    )
    top_products = [
        {
            "label": (t["product__name"] or "—")[:18],
            "value": _f(t["qty"]),
            "color": "green",
        }
        for t in top
    ]

    # ─── Производительность менеджеров ─────────────────────────────────────
    mgr = (
        orders_qs.exclude(manager__isnull=True)
        .values(
            "manager_id",
            "manager__first_name",
            "manager__last_name",
            "manager__username",
        )
        .annotate(c=Count("id"))
        .order_by("-c")[:5]
    )
    managers_performance = [
        {
            "label": (
                m["manager__first_name"] or m["manager__username"] or "—"
            )[:10],
            "value": m["c"],
            "color": "violet",
        }
        for m in mgr
    ]

    # ─── Сегменты клиентов ─────────────────────────────────────────────────
    seg = Client.objects.values("segment").annotate(c=Count("id"))
    client_segments = [
        {
            "label": SEGMENT_LABEL.get(s["segment"], s["segment"]),
            "value": s["c"],
            "color": SEGMENT_COLOR.get(s["segment"], "#8E7CF8"),
        }
        for s in seg
    ]

    # ─── Динамика выручки ──────────────────────────────────────────────────
    if period == "month":
        buckets = (
            payments_qs.annotate(d=TruncDay("date"))
            .values("d")
            .annotate(s=Sum("amount"))
            .order_by("d")
        )
    else:
        buckets = (
            payments_qs.annotate(d=TruncMonth("date"))
            .values("d")
            .annotate(s=Sum("amount"))
            .order_by("d")
        )
    revenue_dynamics = [_f(b["s"]) for b in buckets]
    if not revenue_dynamics:
        revenue_dynamics = [0.0, 0.0]

    # ─── Склад ─────────────────────────────────────────────────────────────
    stock_units = int(Product.objects.aggregate(s=Sum("stock"))["s"] or 0)
    stock_value = (
        Product.objects.aggregate(
            v=Sum(
                F("stock") * F("sale_price"),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            )
        )["v"]
        or Decimal("0")
    )

    return Response(
        {
            "period": period,
            "total_sales": _f(total_sales),
            "total_expenses": _f(total_expenses),
            "net_profit": _f(net_profit),
            "stock_value": _f(stock_value),
            "stock_units": stock_units,
            "orders_count": orders_count,
            "plan_completion": plan_completion,
            "deal_conversion": deal_conversion,
            "deltas": deltas,
            "funnel": funnel,
            "top_clients": top_clients,
            "managers_performance": managers_performance,
            "top_products_units": top_products,
            "weekly_requests": [
                {"label": "Новые лиды", "value": str(leads), "color": "#8E7CF8"},
                {"label": "В работе", "value": str(in_progress), "color": "#5DD9A8"},
                {"label": "Оплачено", "value": str(paid), "color": "#FF6B9D"},
            ],
            "client_segments": client_segments,
            "revenue_dynamics": revenue_dynamics,
            "warehouse_kpi": {
                "turnover": 43,
                "fill_rate": 74,
                "accuracy": 81,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications(request: Request) -> Response:
    """Динамическая лента уведомлений: новые заказы, оплаты, низкие остатки."""
    cutoff = timezone.now() - timedelta(hours=NOTIFICATION_HOURS)
    items: list[dict] = []

    # Новые заказы
    for o in (
        Order.objects.filter(created_at__gte=cutoff)
        .select_related("client")
        .order_by("-created_at")[:15]
    ):
        items.append(
            {
                "id": f"order-{o.id}",
                "type": "new_order",
                "title": f"Новый заказ {o.number}",
                "subtitle": f"{o.client.name}",
                "url": f"/orders/{o.id}",
                "tone": "violet",
                "created_at": o.created_at.isoformat(),
            }
        )

    # Поступившие оплаты
    for p in (
        Payment.objects.filter(created_at__gte=cutoff)
        .select_related("order__client")
        .order_by("-created_at")[:15]
    ):
        items.append(
            {
                "id": f"payment-{p.id}",
                "type": "payment",
                "title": f"Оплата {p.amount} с.",
                "subtitle": f"{p.order.number} · {p.order.client.name}",
                "url": f"/orders/{p.order_id}",
                "tone": "green",
                "created_at": p.created_at.isoformat(),
            }
        )

    # Низкие остатки на складе (не зависят от cutoff — это статус, а не событие)
    for prod in (
        Product.objects.filter(stock__gt=0, stock__lte=LOW_STOCK_THRESHOLD)
        .order_by("stock")[:10]
    ):
        items.append(
            {
                "id": f"low-{prod.id}",
                "type": "low_stock",
                "title": f"Низкий остаток: {prod.name}",
                "subtitle": f"{prod.stock} {prod.get_unit_display()} — пора заказать",
                "url": f"/products/{prod.id}",
                "tone": "yellow",
                "created_at": prod.updated_at.isoformat(),
            }
        )

    items.sort(key=lambda x: x["created_at"], reverse=True)

    return Response(
        {
            "items": items[:20],
            "unread_count": len(items),
        }
    )
