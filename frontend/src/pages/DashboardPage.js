import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import { formatCurrency } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Sidebar from "../components/Sidebar";
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  Banknote,
  ChefHat,
  Clock,
  ArrowUpRight,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { get } = useApi();
  const navigate = useNavigate();
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [report, setReport] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily");

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchDashboardData();
    }
  }, [selectedBranch, period]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      setSelectedBranch(result.data[0].id);
    }
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    const [reportResult, ordersResult, topResult] = await Promise.all([
      get(`/reports/summary/${selectedBranch}`, { period }),
      get("/orders", { branch_id: selectedBranch, is_paid: true }),
      get(`/products/top-sellers/${selectedBranch}`, { limit: 5 }),
    ]);

    if (reportResult.success) setReport(reportResult.data);
    if (ordersResult.success) setRecentOrders(ordersResult.data.slice(0, 5));
    if (topResult.success) setTopProducts(topResult.data);
    
    setLoading(false);
  };

  const stats = [
    {
      title: t("total_revenue"),
      value: formatCurrency(report?.total_revenue || 0),
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: t("total_orders"),
      value: report?.total_orders || 0,
      icon: ShoppingBag,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("cash_sales"),
      value: formatCurrency(report?.cash_total || 0),
      icon: Banknote,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("card_sales"),
      value: formatCurrency(report?.card_total || 0),
      icon: CreditCard,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("welcome")}, {user?.name}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48 bg-card" data-testid="branch-select">
                <SelectValue placeholder={t("select_branch")} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-card" data-testid="period-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("daily_report")}</SelectItem>
                <SelectItem value="weekly">{t("weekly_report")}</SelectItem>
                <SelectItem value="monthly">{t("monthly_report")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-card border-white/5 card-hover" data-testid={`stat-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1 font-mono">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-card border-white/10 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => navigate("/pos")}
                data-testid="quick-action-pos"
              >
                <ShoppingBag className="w-6 h-6 text-primary" />
                <span>{t("pos")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-card border-white/10 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => navigate("/kitchen")}
                data-testid="quick-action-kitchen"
              >
                <ChefHat className="w-6 h-6 text-primary" />
                <span>{t("kitchen")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-card border-white/10 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => navigate("/orders")}
                data-testid="quick-action-orders"
              >
                <Clock className="w-6 h-6 text-primary" />
                <span>{t("orders")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-card border-white/10 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => navigate("/reports")}
                data-testid="quick-action-reports"
              >
                <TrendingUp className="w-6 h-6 text-primary" />
                <span>{t("reports")}</span>
              </Button>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card className="bg-card border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{t("orders")}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
                    {t("all")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("no_data")}</p>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">#{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.table_number ? `${t("table_number")} ${order.table_number}` : t("takeaway")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-semibold">{formatCurrency(order.total)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full status-${order.status}`}>
                              {t(order.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="bg-card border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{t("top_sellers")}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
                    {t("all")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("no_data")}</p>
                  ) : (
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.total_sold} {t("quantity")}
                              </p>
                            </div>
                          </div>
                          <p className="font-mono font-semibold">{formatCurrency(product.price)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
