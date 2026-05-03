import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { isAuthenticated } from "./lib/api";
import { useCurrentUser, isClientRole } from "./lib/auth";
import LoginPage from "./pages/Login";
import CrmLayout from "./layouts/CrmLayout";
import PortalLayout from "./layouts/PortalLayout";
import DashboardPage from "./pages/crm/Dashboard";
import ClientsPage from "./pages/crm/Clients";
import ClientDetailPage from "./pages/crm/ClientDetail";
import ClientNewPage from "./pages/crm/ClientNew";
import ProductsPage from "./pages/crm/Products";
import ProductDetailPage from "./pages/crm/ProductDetail";
import ProductNewPage from "./pages/crm/ProductNew";
import OrdersPage from "./pages/crm/Orders";
import OrderDetailPage from "./pages/crm/OrderDetail";
import OrderNewPage from "./pages/crm/OrderNew";
import OrdersKanbanPage from "./pages/crm/OrdersKanban";
import FinancePage from "./pages/crm/Finance";
import ExpenseNewPage from "./pages/crm/finance/ExpenseNew";
import ExpenseDetailPage from "./pages/crm/finance/ExpenseDetail";
import StatsPage from "./pages/crm/Stats";
import SettingsPage from "./pages/crm/Settings";
import ProfilePage from "./pages/crm/Profile";
import CatalogPage from "./pages/portal/Catalog";
import CartPage from "./pages/portal/Cart";
import MyOrdersPage from "./pages/portal/MyOrders";
import MyProfilePage from "./pages/portal/MyProfile";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function RoleGate({ kind, children }: { kind: "staff" | "client"; children: React.ReactNode }) {
  const { data, isLoading } = useCurrentUser();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-soft">
        Загрузка…
      </div>
    );
  }
  const role = data?.role;
  const isClient = isClientRole(role);
  if (kind === "client" && !isClient) {
    return <Navigate to="/app" replace />;
  }
  if (kind === "staff" && isClient) {
    return <Navigate to="/portal" replace />;
  }
  return <>{children}</>;
}

function AfterLoginRedirect() {
  const { data, isLoading } = useCurrentUser();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-soft">
        Загрузка…
      </div>
    );
  }
  return <Navigate to={isClientRole(data?.role) ? "/portal" : "/app"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AfterLoginRedirect />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <RoleGate kind="staff">
              <CrmLayout />
            </RoleGate>
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientNewPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductNewPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<OrderNewPage />} />
        <Route path="orders/kanban" element={<OrdersKanbanPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="finance/expenses/new" element={<ExpenseNewPage />} />
        <Route path="finance/expenses/:id" element={<ExpenseDetailPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/portal"
        element={
          <RequireAuth>
            <RoleGate kind="client">
              <PortalLayout />
            </RoleGate>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="catalog" replace />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="profile" element={<MyProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
