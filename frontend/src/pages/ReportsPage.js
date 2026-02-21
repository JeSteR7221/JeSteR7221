import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import { formatCurrency, formatDate } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Button } from "../components/ui/button";
import {
  Loader2,
  TrendingUp,
  ShoppingBag,
  Banknote,
  CreditCard,
  Calendar as CalendarIcon,
  BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const { t } = useLanguage();
  const { get } = useApi();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [period, setPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [staffReport, setStaffReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchReports();
    }
  }, [selectedBranch, period, selectedDate]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      setSelectedBranch(result.data[0].id);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    const [summaryResult, staffResult] = await Promise.all([
      get(`/reports/summary/${selectedBranch}`, { period }),
      get(`/reports/staff/${selectedBranch}`),
    ]);

    if (summaryResult.success) setReport(summaryResult.data);
    if (staffResult.success) setStaffReport(staffResult.data);
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

  const paymentData = [
    { name: t("cash"), value: report?.cash_total || 0, color: "#10b981" },
    { name: t("card"), value: report?.card_total || 0, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  const topProductsData = (report?.top_products || []).map((p) => ({
    name: p.product_name,
    quantity: p.quantity,
    revenue: p.revenue,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("reports")}</h1>

          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40" data-testid="date-picker">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {formatDate(selectedDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40" data-testid="period-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("daily_report")}</SelectItem>
                <SelectItem value="weekly">{t("weekly_report")}</SelectItem>
                <SelectItem value="monthly">{t("monthly_report")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48" data-testid="branch-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
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
                <Card key={index} className="bg-card border-white/5" data-testid={`report-stat-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1 font-mono">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="bg-card border border-white/10">
                <TabsTrigger value="products">{t("top_sellers")}</TabsTrigger>
                <TabsTrigger value="payments">{t("payment_method")}</TabsTrigger>
                <TabsTrigger value="staff">{t("staff_sales")}</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <Card className="bg-card border-white/5">
                  <CardHeader>
                    <CardTitle>{t("top_sellers")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topProductsData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                        <p>{t("no_data")}</p>
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topProductsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="quantity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card className="bg-card border-white/5">
                  <CardHeader>
                    <CardTitle>{t("payment_method")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mb-4 opacity-50" />
                        <p>{t("no_data")}</p>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {paymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="staff">
                <Card className="bg-card border-white/5">
                  <CardHeader>
                    <CardTitle>{t("staff_sales")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {staffReport.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <p>{t("no_data")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {staffReport.map((staff, index) => (
                          <div
                            key={staff.cashier_id}
                            className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] + "30", color: COLORS[index % COLORS.length] }}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">{staff.cashier_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {staff.total_orders} {t("orders")}
                                </p>
                              </div>
                            </div>
                            <p className="text-lg font-bold font-mono text-primary">
                              {formatCurrency(staff.total_revenue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
