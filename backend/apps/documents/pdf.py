"""PDF-генерация: счёт, накладная, акт. Используем reportlab (pure-python)."""
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

DOCUMENT_TITLES = {
    "invoice": "Счёт-фактура",
    "waybill": "Товарная накладная",
    "act": "Акт выполненных работ",
}


def render_order_document(order, kind: str) -> bytes:
    from apps.settings_app.models import CompanyProfile

    company = CompanyProfile.load()
    title = DOCUMENT_TITLES.get(kind, "Документ")

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm,
    )
    styles = getSampleStyleSheet()
    h = styles["Heading1"]
    h.alignment = 1
    normal = styles["Normal"]
    small = ParagraphStyle("small", parent=normal, fontSize=9, leading=11)

    story = []
    story.append(Paragraph(f"{title} № {order.number}", h))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        f"<b>Поставщик:</b> {company.name}"
        f"{', ИНН ' + company.inn if company.inn else ''}<br/>"
        f"{company.address or ''}<br/>"
        f"Тел.: {company.phone or '—'} · {company.email or ''}",
        small,
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f"<b>Покупатель:</b> {order.client.name}"
        f"{', ИНН ' + order.client.inn if order.client.inn else ''}<br/>"
        f"{order.client.address or ''}<br/>"
        f"Тел.: {order.client.phone or '—'}",
        small,
    ))
    story.append(Spacer(1, 5 * mm))

    rows = [["№", "Наименование", "Артикул", "Кол-во", "Ед.", "Цена", "Скидка %", "Сумма"]]
    for idx, item in enumerate(order.items.select_related("product").all(), start=1):
        rows.append([
            str(idx),
            item.product.name,
            item.product.sku,
            f"{item.quantity}",
            item.product.get_unit_display(),
            f"{item.price}",
            f"{item.discount}",
            f"{item.sum}",
        ])
    rows.append(["", "", "", "", "", "", "Итого:", f"{order.total}"])

    table = Table(rows, colWidths=[10 * mm, 55 * mm, 25 * mm, 18 * mm, 12 * mm, 22 * mm, 18 * mm, 22 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8E7CF8")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -2), 0.25, colors.grey),
        ("FONTNAME", (-2, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(table)
    story.append(Spacer(1, 8 * mm))

    if kind == "act":
        story.append(Paragraph(
            "Услуги/работы выполнены полностью и в срок. "
            "Стороны претензий друг к другу не имеют.",
            normal,
        ))
        story.append(Spacer(1, 10 * mm))

    story.append(Paragraph(
        "Поставщик: ____________________   "
        "Покупатель: ____________________",
        normal,
    ))

    doc.build(story)
    return buf.getvalue()
