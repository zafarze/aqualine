export type ClientType = "physical" | "legal" | "entrepreneur";
export type ClientSegment = "retail" | "b2b" | "dealer" | "other";
export type ClientStatus = "lead" | "active" | "vip" | "blocked";

export interface Client {
  id: number;
  name: string;
  type: ClientType;
  type_display: string;
  inn: string;
  phone: string;
  email: string;
  address: string;
  segment: ClientSegment;
  segment_display: string;
  status: ClientStatus;
  status_display: string;
  manager: number | null;
  manager_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ClientInput = Partial<
  Omit<Client, "id" | "created_at" | "updated_at" | "type_display" | "segment_display" | "status_display" | "manager_name">
> & {
  name: string;
};

export const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: "physical", label: "Физическое лицо" },
  { value: "legal", label: "Юридическое лицо" },
  { value: "entrepreneur", label: "ИП" },
];

export const CLIENT_SEGMENT_OPTIONS: { value: ClientSegment; label: string }[] =
  [
    { value: "retail", label: "Розница" },
    { value: "b2b", label: "B2B" },
    { value: "dealer", label: "Дилер" },
    { value: "other", label: "Прочее" },
  ];

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "lead", label: "Лид" },
  { value: "active", label: "Активный" },
  { value: "vip", label: "VIP" },
  { value: "blocked", label: "Заблокирован" },
];

// ─── Products ─────────────────────────────────────────────────────────────

export type ProductUnit = "pcs" | "m" | "kg" | "l" | "pack";

export interface Product {
  id: number;
  sku: string;
  name: string;
  unit: ProductUnit;
  unit_display: string;
  purchase_price: string;
  sale_price: string;
  stock: string;
  created_at: string;
  updated_at: string;
}

export type ProductInput = {
  sku: string;
  name: string;
  unit: ProductUnit;
  purchase_price: string;
  sale_price: string;
  stock: string;
};

export const PRODUCT_UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
  { value: "pcs", label: "шт" },
  { value: "m", label: "м" },
  { value: "kg", label: "кг" },
  { value: "l", label: "л" },
  { value: "pack", label: "уп" },
];

// ─── Orders ───────────────────────────────────────────────────────────────

export type OrderStatus =
  | "lead"
  | "quoted"
  | "confirmed"
  | "shipped"
  | "paid"
  | "cancelled";

export interface OrderItem {
  id?: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  quantity: string;
  price: string;
  discount: string;
  sum?: string;
}

export interface Order {
  id: number;
  number: string;
  client: number;
  client_name: string;
  manager: number | null;
  manager_name: string;
  status: OrderStatus;
  status_display: string;
  due_date: string | null;
  notes: string;
  items: OrderItem[];
  payments?: unknown[];
  paid_amount?: string;
  balance_due?: string;
  total: string;
  created_at: string;
  updated_at: string;
}

export type OrderInput = {
  client: number | "";
  manager?: number | null;
  status: OrderStatus;
  due_date: string | null;
  notes: string;
  items: OrderItem[];
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "lead", label: "Заявка" },
  { value: "quoted", label: "Предложение" },
  { value: "confirmed", label: "Подтверждён" },
  { value: "shipped", label: "Отгружен" },
  { value: "paid", label: "Оплачен" },
  { value: "cancelled", label: "Отменён" },
];

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  "yellow" | "violet" | "green" | "pink" | "neutral"
> = {
  lead: "yellow",
  quoted: "violet",
  confirmed: "violet",
  shipped: "green",
  paid: "green",
  cancelled: "pink",
};

// ─── Finance ─────────────────────────────────────────────────────────────

export type CategoryType = "expense" | "income";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  type_display: string;
  color: string;
  created_at: string;
}

export interface Expense {
  id: number;
  category: number;
  category_name: string;
  category_color: string;
  amount: string;
  date: string;
  description: string;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseInput = {
  category: number | "";
  amount: string;
  date: string;
  description: string;
};

export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export interface Payment {
  id: number;
  order: number;
  order_number?: string;
  amount: string;
  date: string;
  method: PaymentMethod;
  method_display: string;
  notes: string;
  created_at: string;
}

export type PaymentInput = {
  order: number;
  amount: string;
  date: string;
  method: PaymentMethod;
  notes: string;
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  [
    { value: "cash", label: "Наличные" },
    { value: "card", label: "Карта" },
    { value: "transfer", label: "Перевод" },
    { value: "other", label: "Прочее" },
  ];

// ─── Users / auth ────────────────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "manager"
  | "warehouse"
  | "accountant"
  | "client";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  phone: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────

export type DashboardPeriod = "month" | "year" | "all";

// ─── Header: search + notifications ──────────────────────────────────────

export type SearchResultType = "client" | "order" | "product";

export interface SearchResultItem {
  type: SearchResultType;
  title: string;
  subtitle: string;
  url: string;
}

export type NotificationTone =
  | "violet"
  | "pink"
  | "green"
  | "yellow"
  | "blue";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  tone: NotificationTone;
  created_at: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unread_count: number;
}

export interface FunnelStage {
  status: OrderStatus;
  label: string;
  count: number;
  color: string;
}

export interface TopClient {
  id: number;
  name: string;
  amount: number;
  orders: number;
}

export interface DashboardKPI {
  period: DashboardPeriod;
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  stock_value: number;
  stock_units: number;
  orders_count: number;
  plan_completion: number;
  deal_conversion: number;
  deltas: {
    sales: number | null;
    orders: number | null;
    conversion: number | null;
  };
  funnel: FunnelStage[];
  top_clients: TopClient[];
  managers_performance: { label: string; value: number; color: string }[];
  top_products_units: { label: string; value: number; color: string }[];
  weekly_requests: { label: string; value: string; color: string }[];
  client_segments: { label: string; value: number; color: string }[];
  revenue_dynamics: number[];
  warehouse_kpi: { turnover: number; fill_rate: number; accuracy: number };
}

// Order with payments populated
export interface OrderWithPayments extends Order {
  paid_amount: string;
  balance_due: string;
  payments: Payment[];
}
