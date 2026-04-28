# AquaLine CRM

Монорепозиторий: Next.js 15 (CRM-портал + Кабинет клиента) + Django 5 / DRF + PostgreSQL 16.

```
AquaLine/
├── frontend/                    # pnpm-монорепо
│   ├── apps/
│   │   ├── crm/                 # crm.aqualine.tj — внутренний портал
│   │   └── cabinet/             # cabinet.aqualine.tj — кабинет клиента
│   └── packages/
│       └── ui/                  # neumorphic дизайн-система
└── backend/                     # Django + DRF + Postgres
    ├── config/                  # settings, urls, wsgi
    └── apps/                    # users, dashboard, ...
```

## Быстрый старт через Docker

```bash
docker compose up --build
```

| Сервис   | URL                                         |
| -------- | ------------------------------------------- |
| CRM      | http://localhost:3000                       |
| Cabinet  | http://localhost:3001                       |
| Backend  | http://localhost:8000/api/                  |
| Swagger  | http://localhost:8000/api/schema/swagger-ui/ |
| Admin    | http://localhost:8000/admin/                |

## Локальная разработка без Docker

### Frontend
```bash
cd frontend
corepack enable
pnpm install
pnpm dev         # запустит crm и cabinet параллельно
```

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations users
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Без `DATABASE_URL` бэкенд автоматически падает на SQLite — удобно для первого запуска.

## Технологический стек

Соответствует ТЗ `AquaLine_CRM_TZ_v1.2.docx`:

- **Frontend**: Next.js 15, React 18, TypeScript strict, Tailwind, lucide-react.
- **Backend**: Python 3.12, Django 5, DRF, simplejwt + djoser, drf-spectacular, psycopg 3, django-environ.
- **БД**: PostgreSQL 16.
- **Инфра**: Docker Compose, Gunicorn, Nginx (на проде).

## Создание администратора (для первого входа)

Без суперпользователя нечем войти в `/login`. После старта backend выполните:

```bash
# Docker:
docker compose exec backend python manage.py createsuperuser

# Локально:
cd backend && .venv\Scripts\activate && python manage.py createsuperuser
```

Затем введите эти логин/пароль на странице http://localhost:3000/login.

## Что готово

### Этап 0
- [x] Каркас монорепо frontend + Django backend, `docker-compose`.
- [x] Neumorphic дизайн-система (Tailwind preset + 16 компонентов).
- [x] CRM Dashboard 1в1 с референсом.
- [x] API `/api/dashboard/kpi/` с моками из ТЗ.

### Этап 1
- [x] JWT-аутентификация с авто-refresh (`lib/api.ts`).
- [x] Страница `/login` + protected route group `(app)`.
- [x] Sidebar с активной подсветкой по URL и кнопкой выхода.
- [x] Модуль **Клиенты**: список с поиском и фильтрами, CRUD.
- [x] Backend: `Client` + DRF ViewSet с `django-filter`.

### Этап 2
- [x] Модуль **Товары** (`/products`): SKU, ед.изм, закуп/розничная цена, остаток, CRUD.
- [x] Модуль **Заказы** (`/orders`): авто-номер `AQ-YYYY-NNNN`, 6 статусов, динамические позиции с автосуммой, фильтр по статусу, поиск.
- [x] Backend: nested `Order + OrderItem` с атомарным create/update в транзакции.

### Этап 3
- [x] Модуль **Финансы** (`/finance`): `Category`, `Expense` (CRUD), `Payment` (привязан к заказу).
- [x] Блок **Оплаты на странице заказа**: добавление/удаление, расчёт остатка к доплате.
- [x] **Живой Dashboard**: реальные агрегации (`Sum`, `Count`, `TruncMonth/Day`) с фильтром периода `month/year/all`.
- [x] OrderSerializer: `paid_amount`, `balance_due`, nested `payments`.
- [x] Кастомная пагинация с `?page_size=`.

### Дальше
- [ ] Поставщики и закупки.
- [ ] Документы: генерация PDF (счёт, накладная, акт).
- [ ] Воронка сделок (kanban по статусам заказов).
- [ ] PWA, уведомления, миграция данных из Excel.
