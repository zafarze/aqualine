"""Заливка демо-данных AquaLine CRM для презентации заказчику.

Использование:
    python manage.py seed_demo                # дозаливка (idempotent)
    python manage.py seed_demo --flush        # снести бизнес-данные и залить заново
    python manage.py seed_demo --orders 80    # больше заказов
"""
from __future__ import annotations

import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.clients.models import Client, ClientInteraction, ClientTag, ClientTask
from apps.finance.models import Category, Expense, Payment
from apps.notifications.models import Notification
from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from apps.purchases.models import PurchaseOrder, PurchaseOrderItem
from apps.settings_app.models import Branch, CompanyProfile, Currency, ExchangeRate
from apps.stock.models import Warehouse
from apps.suppliers.models import Supplier

User = get_user_model()
random.seed(42)


# ─── Справочники ──────────────────────────────────────────────────────────

USERS = [
    ("admin",     "Олег",     "Турсунов",   "super_admin", "+992 935 11 22 33"),
    ("director",  "Шерали",   "Назаров",    "director",    "+992 935 22 33 44"),
    ("manager1",  "Зухра",    "Каримова",   "manager",     "+992 935 33 44 55"),
    ("manager2",  "Бахтиёр",  "Хакимов",    "manager",     "+992 935 44 55 66"),
    ("warehouse", "Фарход",   "Рахимов",    "warehouse",   "+992 935 55 66 77"),
    ("accountant","Мадина",   "Юсупова",    "accountant",  "+992 935 66 77 88"),
    ("purchaser", "Сухроб",   "Достиев",    "purchaser",   "+992 935 77 88 99"),
]

CLIENTS = [
    ("ООО «АкваСтрой»",           "legal",       "020012345678", "+992 901 11 11 11", "stroy@akva.tj",       "г. Душанбе, ул. Айни 12",          "b2b",    "vip",     "Постоянный клиент, крупные объекты"),
    ("ИП Каримов А.Х.",            "entrepreneur","010098765432", "+992 901 22 22 22", "karimov.ip@mail.tj",  "г. Худжанд, ул. Ленина 45",        "dealer", "active",  "Дилер по северу"),
    ("ООО «ВодоПром»",             "legal",       "020076543210", "+992 901 33 33 33", "info@vodoprom.tj",    "г. Бохтар, пр. Дусти 8",           "b2b",    "active",  ""),
    ("ИП Назарова М.С.",           "entrepreneur","010054321098", "+992 901 44 44 44", "nazarova@mail.ru",    "г. Куляб, ул. Восе 22",            "retail", "active",  ""),
    ("ООО «СантехМастер»",         "legal",       "020043215678", "+992 901 55 55 55", "santeh@master.tj",    "г. Душанбе, пр. Рудаки 84",        "b2b",    "vip",     "Сеть из 4 магазинов"),
    ("Холмуродов Дилшод",          "physical",    "",            "+992 901 66 66 66", "",                   "г. Турсунзаде, ул. Сино 5",        "retail", "active",  ""),
    ("ООО «Дома Душанбе»",         "legal",       "020067891234", "+992 901 77 77 77", "office@domadush.tj",  "г. Душанбе, ул. Шотемур 130",      "b2b",    "lead",    "Новый, просили КП"),
    ("ИП Саидов Р.",               "entrepreneur","010012348765", "+992 901 88 88 88", "saidov@gmail.com",    "г. Истаравшан, ул. Гагарина 15",   "dealer", "active",  ""),
    ("ОАО «Промстрой-Таджикистан»","legal",       "020098712345", "+992 901 99 99 99", "info@promstroy.tj",   "г. Душанбе, пр. Исмоила Сомони 60","b2b",    "vip",     "Госзаказы"),
    ("Шарипов Алишер",             "physical",    "",            "+992 902 11 22 33", "",                   "г. Вахдат, ул. Мира 7",            "retail", "blocked", "Долг с прошлого года"),
]

SUPPLIERS = [
    ("ООО «Турция-Пайп»",       "legal", "020011223344", "Мехмет Йылмаз",    "+90 212 555 33 44", "info@turkiye-pipe.com.tr", "Стамбул, Турция",   "Предоплата 30% + 70% по факту, 14 дней", 5),
    ("ОАО «Россметалл»",         "legal", "770098765432", "Иван Петров",      "+7 495 123 45 67",  "sales@rosmetal.ru",        "Москва, Россия",    "Отсрочка 21 день",                       4),
    ("ИП Хасан Ali",             "entrepreneur","",      "Hassan Ali",        "+98 21 1234 5678",  "ali@iranpump.ir",          "Тегеран, Иран",     "100% по факту",                          3),
    ("ООО «Душанбе-Снабжение»",  "legal", "020055667788", "Рустам Кодиров",   "+992 935 12 34 56", "ds@snab.tj",               "Душанбе, ул. Айни", "Наличные на выгрузке",                   4),
]

PRODUCTS = [
    # (sku,        name,                                    unit, purchase, sale, stock, min_stock, barcode)
    ("EBV20MM",    "Труба ПНД ⌀20 мм PN10",                  "m",   3.50,   5.20,  3500, 200, "4607012345678"),
    ("EBV25MM",    "Труба ПНД ⌀25 мм PN10",                  "m",   4.20,   6.30,  2800, 150, "4607012345685"),
    ("EBV32MM",    "Труба ПНД ⌀32 мм PN10",                  "m",   6.10,   9.10,  2200, 120, "4607012345692"),
    ("EBV40MM",    "Труба ПНД ⌀40 мм PN16",                  "m",   9.40,  13.50,  1500, 100, "4607012345708"),
    ("EBV50MM",    "Труба ПНД ⌀50 мм PN16",                  "m",  14.20,  20.00,   900,  60, "4607012345715"),
    ("FIT-T20",    "Фитинг тройник ⌀20 мм",                   "pcs", 8.00,  13.50,  1800, 100, "4607012345722"),
    ("FIT-T25",    "Фитинг тройник ⌀25 мм",                   "pcs",10.00,  16.00,  1200,  80, "4607012345739"),
    ("FIT-K20",    "Фитинг колено 90° ⌀20 мм",                "pcs", 6.00,  10.50,  2400, 120, "4607012345746"),
    ("FIT-K25",    "Фитинг колено 90° ⌀25 мм",                "pcs", 7.50,  12.50,  1600, 100, "4607012345753"),
    ("FIT-M20-1Z", "Муфта ⌀20×1\" ВР",                        "pcs",12.00,  19.00,   850,  60, "4607012345760"),
    ("PUMP-08K",   "Насос погружной 0.8 кВт",                 "pcs",420.00, 685.00,   180,  10, "4607012345777"),
    ("PUMP-15K",   "Насос поверхностный 1.5 кВт",             "pcs",590.00, 920.00,   140,   8, "4607012345784"),
    ("FILTER-1Z",  "Фильтр сетчатый 1\"",                     "pcs",18.50,  29.00,   620,  40, "4607012345791"),
    ("VALVE-1Z",   "Кран шаровой 1\" латунный",               "pcs",22.00,  35.00,  1100,  60, "4607012345807"),
    ("VALVE-34Z",  "Кран шаровой 3/4\" латунный",             "pcs",17.50,  28.00,  1300,  80, "4607012345814"),
    ("HOSE-12M",   "Шланг армированный ⌀12 мм (бухта 50м)",   "pack",180.00,275.00,   240,  20, "4607012345821"),
    ("TANK-100L",  "Бак расширительный 100л",                 "pcs",350.00, 520.00,    95,   8, "4607012345838"),
    ("TANK-200L",  "Бак расширительный 200л",                 "pcs",520.00, 780.00,    62,   6, "4607012345845"),
    ("MANIFOLD-4", "Коллектор 4 выхода ⌀1\"",                 "pcs", 95.00, 145.00,   320,  20, "4607012345852"),
    ("SEAL-FUM",   "Лента ФУМ 19мм×0.075мм×15м",              "pcs",  4.50,   8.00,  3500, 300, "4607012345869"),
]

# Лимит количества в одной позиции заказа (как % от стартового остатка) —
# чтобы 60 заказов не выгребли весь склад в минус.
QTY_FRACTION = 0.05  # одна позиция = до 5% от стартового остатка

EXPENSE_CATEGORIES = [
    ("Аренда",          "expense", "#FF6B9D"),
    ("Зарплата",         "expense", "#8E7CF8"),
    ("Коммунальные",     "expense", "#F5C24A"),
    ("Транспорт",        "expense", "#5DD9A8"),
    ("Реклама",          "expense", "#A78BFA"),
    ("Налоги",           "expense", "#EF4444"),
    ("Канцелярия",       "expense", "#34D399"),
    ("Прочее",           "expense", "#94A3B8"),
]
INCOME_CATEGORIES = [
    ("Розничные продажи", "income", "#10B981"),
    ("Оптовые продажи",   "income", "#059669"),
]

EXPENSE_DESCRIPTIONS = {
    "Аренда": ["Офис на Айни", "Склад на Шотемур", "Доп. площадь склада"],
    "Зарплата": ["ЗП менеджеров", "ЗП кладовщика", "ЗП бухгалтера", "Премии"],
    "Коммунальные": ["Электричество", "Вода и канализация", "Интернет"],
    "Транспорт": ["Бензин Газель", "ТО грузовика", "Доставка из Стамбула"],
    "Реклама": ["Instagram продвижение", "Печать каталогов", "Баннер на М41"],
    "Налоги": ["НДС квартальный", "Налог на прибыль", "Соц. отчисления"],
    "Канцелярия": ["Бумага и картриджи", "Канцтовары"],
    "Прочее": ["Хозтовары", "Чай и кофе для офиса"],
}

CLIENT_TAGS = [
    ("VIP",            "#10B981"),
    ("Госзаказ",       "#A78BFA"),
    ("Долг",           "#EF4444"),
    ("Перспектива",    "#F5C24A"),
    ("Север",          "#5DD9A8"),
    ("Сеть",           "#FF6B9D"),
]


# ─── Команда ──────────────────────────────────────────────────────────────


class Command(BaseCommand):
    help = "Заливка демо-данных AquaLine для презентации"

    def add_arguments(self, parser) -> None:
        parser.add_argument("--flush", action="store_true",
                            help="Снести существующие бизнес-данные перед заливкой")
        parser.add_argument("--orders", type=int, default=60,
                            help="Сколько заказов сгенерировать (default 60)")
        parser.add_argument("--password", default="aqualine123",
                            help="Пароль для всех демо-пользователей")

    @transaction.atomic
    def handle(self, *args, **opts) -> None:
        flush = opts["flush"]
        n_orders = opts["orders"]
        password = opts["password"]

        if flush:
            self._flush()

        self.stdout.write(self.style.MIGRATE_HEADING(">> Профиль компании"))
        self._company()

        self.stdout.write(self.style.MIGRATE_HEADING(">> Валюты, филиалы, склады"))
        self._refs()

        self.stdout.write(self.style.MIGRATE_HEADING(">> Пользователи"))
        users = self._users(password)

        self.stdout.write(self.style.MIGRATE_HEADING(">> Поставщики"))
        suppliers = self._suppliers()

        self.stdout.write(self.style.MIGRATE_HEADING(">> Товары"))
        products = self._products()

        self.stdout.write(self.style.MIGRATE_HEADING(">> Категории финансов"))
        cats = self._categories()

        self.stdout.write(self.style.MIGRATE_HEADING(">> Клиенты + теги + взаимодействия + задачи"))
        clients = self._clients(users)

        self.stdout.write(self.style.MIGRATE_HEADING(">> Закупки"))
        self._purchases(suppliers, products, users)

        self.stdout.write(self.style.MIGRATE_HEADING(f">> Заказы ({n_orders})"))
        self._orders(clients, products, users, n_orders)

        self.stdout.write(self.style.MIGRATE_HEADING(">> Расходы"))
        self._expenses(cats, users)

        self.stdout.write(self.style.MIGRATE_HEADING(">> Уведомления"))
        self._notifications()

        self.stdout.write(self.style.SUCCESS("\n[OK] Демо-данные залиты."))
        self.stdout.write("  Логины: " + ", ".join(u[0] for u in USERS))
        self.stdout.write(f"  Пароль: {password}")

    # ─── helpers ──────────────────────────────────────────────────────────

    def _flush(self) -> None:
        self.stdout.write(self.style.WARNING("Удаляю бизнес-данные..."))
        Notification.objects.all().delete()
        Payment.objects.all().delete()
        Expense.objects.all().delete()
        Category.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        PurchaseOrderItem.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        ClientTask.objects.all().delete()
        ClientInteraction.objects.all().delete()
        ClientTag.objects.all().delete()
        Client.objects.all().delete()
        Supplier.objects.all().delete()
        # склад/товары/историю стираем тоже — иначе дубликаты SKU
        from apps.stock.models import StockMovement
        StockMovement.objects.all().delete()
        Product.objects.all().delete()
        Warehouse.objects.all().delete()
        ExchangeRate.objects.all().delete()
        Currency.objects.all().delete()
        Branch.objects.all().delete()
        # пользователи кроме superuser
        User.objects.filter(is_superuser=False).delete()

    def _company(self) -> None:
        cp = CompanyProfile.load()
        cp.name = "AquaLine"
        cp.legal_name = "ООО «AquaLine»"
        cp.inn = "020099887766"
        cp.address = "Республика Таджикистан, г. Душанбе, ул. Айни 24"
        cp.phone = "+992 44 600 12 34"
        cp.email = "info@aqualine.tj"
        cp.website = "https://aqualine.tj"
        cp.bank_details = "Р/с 20202972000000123 в ОАО «Ориёнбанк», БИК 350101626"
        cp.default_currency = "TJS"
        cp.tax_rate = Decimal("18.00")
        cp.save()

    def _refs(self) -> None:
        for code, name, sym in [
            ("TJS", "Сомони",        "с."),
            ("USD", "Доллар США",    "$"),
            ("RUB", "Российский руб.","₽"),
        ]:
            cur, _ = Currency.objects.get_or_create(code=code, defaults={"name": name, "symbol": sym})
            ExchangeRate.objects.get_or_create(
                currency=cur, date=date.today(),
                defaults={
                    "rate": {"TJS": Decimal("1.0000"), "USD": Decimal("10.5000"), "RUB": Decimal("0.1100")}[code],
                    "source": "demo",
                },
            )
        for name, addr in [
            ("Главный офис", "г. Душанбе, ул. Айни 24"),
            ("Филиал Худжанд", "г. Худжанд, ул. Ленина 100"),
            ("Филиал Бохтар", "г. Бохтар, пр. Дусти 50"),
        ]:
            Branch.objects.get_or_create(name=name, defaults={"address": addr})

        Warehouse.objects.get_or_create(
            name="Центральный склад",
            defaults={"code": "WH-MAIN", "is_default": True, "address": "Душанбе, ул. Шотемур 130"},
        )
        Warehouse.objects.get_or_create(
            name="Склад Худжанд",
            defaults={"code": "WH-KHJ", "address": "г. Худжанд, промзона"},
        )

    def _users(self, password: str) -> dict:
        users = {}
        for username, first, last, role, phone in USERS:
            u, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last,
                          "email": f"{username}@aqualine.tj", "role": role, "phone": phone,
                          "is_staff": role in ("super_admin", "admin", "director")},
            )
            if created:
                u.set_password(password)
                u.save()
            users[username] = u
        return users

    def _suppliers(self) -> list:
        out = []
        for name, type_, inn, contact, phone, email, addr, terms, rating in SUPPLIERS:
            s, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={"type": type_, "inn": inn, "contact_person": contact,
                          "phone": phone, "email": email, "address": addr,
                          "payment_terms": terms, "rating": rating, "is_active": True},
            )
            out.append(s)
        return out

    def _products(self) -> list:
        out = []
        for sku, name, unit, pp, sp, stock, ms, bc in PRODUCTS:
            p, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name, "unit": unit,
                    "purchase_price": Decimal(str(pp)), "sale_price": Decimal(str(sp)),
                    "stock": Decimal(str(stock)), "min_stock": Decimal(str(ms)),
                    "barcode": bc, "is_active": True,
                },
            )
            out.append(p)
        return out

    def _categories(self) -> dict:
        cats = {}
        for name, type_, color in EXPENSE_CATEGORIES + INCOME_CATEGORIES:
            c, _ = Category.objects.get_or_create(
                name=name, type=type_, defaults={"color": color}
            )
            cats[name] = c
        return cats

    def _clients(self, users: dict) -> list:
        managers = [users["manager1"], users["manager2"]]
        tags = {}
        for name, color in CLIENT_TAGS:
            t, _ = ClientTag.objects.get_or_create(name=name, defaults={"color": color})
            tags[name] = t

        out = []
        for i, (name, type_, inn, phone, email, addr, segment, status, notes) in enumerate(CLIENTS):
            c, _ = Client.objects.get_or_create(
                name=name,
                defaults={"type": type_, "inn": inn, "phone": phone, "email": email,
                          "address": addr, "segment": segment, "status": status,
                          "notes": notes, "manager": managers[i % 2]},
            )
            # теги
            if status == "vip":
                c.tags.add(tags["VIP"])
            if "Гос" in notes:
                c.tags.add(tags["Госзаказ"])
            if status == "blocked":
                c.tags.add(tags["Долг"])
            if "Север" in addr or "Худжанд" in addr or "Истаравшан" in addr:
                c.tags.add(tags["Север"])
            if "Сеть" in notes:
                c.tags.add(tags["Сеть"])
            if status == "lead":
                c.tags.add(tags["Перспектива"])
            out.append(c)

        # Взаимодействия
        for c in out[:6]:
            for d in range(random.randint(2, 5)):
                ClientInteraction.objects.create(
                    client=c,
                    channel=random.choice(["call", "meeting", "messenger", "email"]),
                    summary=random.choice([
                        "Уточнили объёмы на следующий месяц",
                        "Обсудили скидку на оптовую партию труб",
                        "Согласовали отгрузку до конца недели",
                        "Принято КП по фитингам",
                        "Жалоба на задержку доставки — решено",
                    ]),
                    user=managers[d % 2],
                    occurred_at=timezone.now() - timedelta(days=random.randint(1, 60)),
                )

        # Задачи
        for c in out[:4]:
            ClientTask.objects.create(
                client=c, title=f"Перезвонить по {c.name}",
                description="Согласовать условия следующей поставки",
                due_at=timezone.now() + timedelta(days=random.randint(1, 14)),
                assignee=managers[0],
            )
        return out

    def _purchases(self, suppliers: list, products: list, users: dict) -> None:
        wh = Warehouse.objects.filter(is_default=True).first()
        statuses = [
            PurchaseOrder.Status.RECEIVED,
            PurchaseOrder.Status.RECEIVED,
            PurchaseOrder.Status.CONFIRMED,
            PurchaseOrder.Status.SENT,
            PurchaseOrder.Status.DRAFT,
        ]
        for i, status in enumerate(statuses):
            po = PurchaseOrder.objects.create(
                supplier=random.choice(suppliers),
                warehouse=wh,
                status=PurchaseOrder.Status.DRAFT,  # создаём как draft, потом меняем
                expected_date=date.today() + timedelta(days=random.randint(-20, 20)),
                received_date=date.today() - timedelta(days=random.randint(1, 30)) if status == PurchaseOrder.Status.RECEIVED else None,
                notes=f"Демо закупка #{i + 1}",
                created_by=users["purchaser"],
            )
            for prod in random.sample(products, k=random.randint(3, 6)):
                PurchaseOrderItem.objects.create(
                    purchase_order=po, product=prod,
                    quantity=Decimal(random.choice([10, 25, 50, 100, 200])),
                    price=prod.purchase_price * Decimal("0.95"),
                )
            # сейчас триггерим финальный статус — сериализатор делает это через _sync_status,
            # но здесь мы пишем напрямую, поэтому при RECEIVED создадим приходы вручную
            po.status = status
            po.save(update_fields=["status"])
            if status == PurchaseOrder.Status.RECEIVED:
                from apps.stock.models import StockMovement
                from apps.purchases.models import PurchasePriceHistory
                for it in po.items.all():
                    StockMovement.objects.create(
                        type=StockMovement.Type.IN,
                        product=it.product, warehouse=wh,
                        quantity=it.quantity, price=it.price,
                        reference=po.number, notes=f"Приход по {po.number}",
                    )
                    PurchasePriceHistory.objects.create(
                        supplier=po.supplier, product=it.product,
                        price=it.price, purchase_order=po,
                    )

    def _orders(self, clients: list, products: list, users: dict, n: int) -> None:
        managers = [users["manager1"], users["manager2"]]
        STATUS_DIST = (
            [Order.Status.LEAD] * 12
            + [Order.Status.QUOTED] * 8
            + [Order.Status.CONFIRMED] * 10
            + [Order.Status.SHIPPED] * 8
            + [Order.Status.PAID] * 22
            + [Order.Status.CANCELLED] * 4
        )
        for i in range(n):
            client = random.choice(clients)
            status = random.choice(STATUS_DIST)
            created_at = timezone.now() - timedelta(days=random.randint(0, 90))

            order = Order(
                client=client,
                manager=random.choice(managers),
                status=Order.Status.LEAD,  # стартуем как lead, потом продвинем
                due_date=(created_at + timedelta(days=random.randint(3, 21))).date(),
                notes=random.choice(["", "Срочно", "Самовывоз со склада", "Доставка до объекта"]),
            )
            order.save()
            # подменим created_at вручную (auto_now_add не позволит через .save kwargs)
            Order.objects.filter(pk=order.pk).update(created_at=created_at)
            order.refresh_from_db()

            for prod in random.sample(products, k=random.randint(1, 5)):
                # cap по 5% от стартового остатка → склад не уйдёт в минус
                cap = max(1, int(float(prod.stock) * QTY_FRACTION))
                qty_options = [q for q in (1, 2, 3, 5, 10, 25, 50) if q <= cap]
                if not qty_options:
                    qty_options = [1]
                qty = Decimal(random.choice(qty_options))
                discount = Decimal(random.choice([0, 0, 0, 5, 10]))
                OrderItem.objects.create(
                    order=order, product=prod,
                    quantity=qty, price=prod.sale_price, discount=discount,
                )

            # Продвигаем по воронке — это вызовет сигналы (резерв, отгрузка)
            target = status
            transitions = {
                Order.Status.LEAD: [],
                Order.Status.QUOTED: [Order.Status.QUOTED],
                Order.Status.CONFIRMED: [Order.Status.QUOTED, Order.Status.CONFIRMED],
                Order.Status.SHIPPED: [Order.Status.QUOTED, Order.Status.CONFIRMED, Order.Status.SHIPPED],
                Order.Status.PAID: [Order.Status.QUOTED, Order.Status.CONFIRMED, Order.Status.SHIPPED, Order.Status.PAID],
                Order.Status.CANCELLED: [Order.Status.CANCELLED],
            }
            for s in transitions.get(target, []):
                order.status = s
                order.save(update_fields=["status"])

            # оплаты для PAID и частично для SHIPPED
            if target == Order.Status.PAID:
                Payment.objects.create(
                    order=order, amount=order.total,
                    date=created_at.date() + timedelta(days=random.randint(1, 14)),
                    method=random.choice(["cash", "card", "transfer"]),
                )
            elif target == Order.Status.SHIPPED and random.random() < 0.5:
                Payment.objects.create(
                    order=order, amount=(order.total / 2).quantize(Decimal("0.01")),
                    date=created_at.date() + timedelta(days=random.randint(1, 7)),
                    method="transfer", notes="Предоплата 50%",
                )

    def _expenses(self, cats: dict, users: dict) -> None:
        accountant = users["accountant"]
        for d in range(0, 90, 1):
            day = date.today() - timedelta(days=d)
            # каждые 3 дня — несколько расходов
            if d % 3 != 0:
                continue
            for cat_name in random.sample(list(EXPENSE_DESCRIPTIONS.keys()), k=random.randint(1, 3)):
                Expense.objects.create(
                    category=cats[cat_name],
                    amount=Decimal(random.choice([
                        50, 80, 120, 200, 350, 500, 800, 1200, 2500, 4500, 8000,
                    ])),
                    date=day,
                    description=random.choice(EXPENSE_DESCRIPTIONS[cat_name]),
                    created_by=accountant,
                )

    def _notifications(self) -> None:
        # сигналы уже создали кучу уведомлений по новым заказам/оплатам/низким остаткам.
        # добавим парочку системных:
        Notification.objects.create(
            type=Notification.Type.SYSTEM, tone=Notification.Tone.INFO,
            title="Демо-данные залиты",
            body="Это демонстрационная среда AquaLine CRM. Все данные сгенерированы.",
            url="/dashboard",
        )
        Notification.objects.create(
            type=Notification.Type.OVERDUE, tone=Notification.Tone.DANGER,
            title="Просроченная оплата: ОАО «Промстрой-Таджикистан»",
            body="Долг 12 500 с. с 12 марта",
            url="/clients",
        )
