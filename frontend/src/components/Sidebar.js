import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Calculator,
  ChefHat,
  ShoppingBag,
  Package,
  Grid3X3,
  Utensils,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard", roles: ["admin"] },
  { path: "/pos", icon: Calculator, labelKey: "pos", roles: ["admin", "cashier"] },
  { path: "/kitchen", icon: ChefHat, labelKey: "kitchen", roles: ["admin", "kitchen"] },
  { path: "/orders", icon: ShoppingBag, labelKey: "orders", roles: ["admin", "cashier"] },
  { path: "/products", icon: Package, labelKey: "products", roles: ["admin"] },
  { path: "/categories", icon: Grid3X3, labelKey: "categories", roles: ["admin"] },
  { path: "/tables", icon: Utensils, labelKey: "tables", roles: ["admin"] },
  { path: "/branches", icon: Building2, labelKey: "branches", roles: ["admin"] },
  { path: "/users", icon: Users, labelKey: "users", roles: ["admin"] },
  { path: "/reports", icon: BarChart3, labelKey: "reports", roles: ["admin"] },
  { path: "/settings", icon: Settings, labelKey: "settings", roles: ["admin"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-primary">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Lumina POS</h1>
            <p className="text-xs text-muted-foreground">{user?.branch_id ? "Branch" : "Admin"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "sidebar-item",
                isActive && "active"
              )
            }
            data-testid={`nav-${item.labelKey}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          data-testid="sidebar-lang-toggle"
        >
          <Globe className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">{language === "tr" ? "Türkçe" : "English"}</span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-lg">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{t(user?.role)}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-3" />
          {t("logout")}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-card rounded-lg border border-white/10 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        data-testid="mobile-menu-toggle"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-card border-r border-white/5 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
