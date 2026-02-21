import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import { formatCurrency, formatDateTime } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Loader2, Search, Eye, RefreshCw } from "lucide-react";

export default function OrdersPage() {
  const { t } = useLanguage();
  const { get, put } = useApi();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchOrders();
    }
  }, [selectedBranch, statusFilter]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      setSelectedBranch(result.data[0].id);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const params = { branch_id: selectedBranch };
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    const result = await get("/orders", params);
    if (result.success) {
      setOrders(result.data);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, status) => {
    const result = await put(`/orders/${orderId}/status?status=${status}`);
    if (result.success) {
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    return (
      order.order_number.toString().includes(searchQuery) ||
      order.table_number?.toString().includes(searchQuery)
    );
  });

  const getStatusBadge = (status) => {
    const variants = {
      pending: "bg-yellow-500/20 text-yellow-500",
      preparing: "bg-blue-500/20 text-blue-500",
      ready: "bg-green-500/20 text-green-500",
      delivered: "bg-gray-500/20 text-gray-400",
      cancelled: "bg-red-500/20 text-red-500",
    };
    return variants[status] || "bg-gray-500/20";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("orders")}</h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
                data-testid="orders-search"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder={t("all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="preparing">{t("preparing")}</SelectItem>
                <SelectItem value="ready">{t("ready")}</SelectItem>
                <SelectItem value="delivered">{t("delivered")}</SelectItem>
                <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48" data-testid="branch-filter">
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

            <Button variant="outline" size="icon" onClick={fetchOrders} data-testid="refresh-orders">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="bg-card border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">{t("no_data")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="bg-card border-white/5 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedOrder(order)}
                data-testid={`order-row-${order.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xl font-bold font-mono">#{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusBadge(order.status)}>
                        {t(order.status)}
                      </Badge>
                      {order.is_paid && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          {t("paid")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {order.table_number
                            ? `${t("table_number")} ${order.table_number}`
                            : t(order.order_type)}
                        </p>
                        <p className="text-lg font-bold font-mono text-primary">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`view-order-${order.id}`}>
                        <Eye className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("order_details")} #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Status & Info */}
              <div className="flex items-center gap-3">
                <Badge className={getStatusBadge(selectedOrder.status)}>
                  {t(selectedOrder.status)}
                </Badge>
                {selectedOrder.is_paid && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    {t("paid")} - {t(selectedOrder.payment_method)}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("order_type")}</p>
                  <p className="font-medium">{t(selectedOrder.order_type)}</p>
                </div>
                {selectedOrder.table_number && (
                  <div>
                    <p className="text-muted-foreground">{t("table_number")}</p>
                    <p className="font-medium">{selectedOrder.table_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Tarih</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
                {selectedOrder.cashier_name && (
                  <div>
                    <p className="text-muted-foreground">{t("cashier")}</p>
                    <p className="font-medium">{selectedOrder.cashier_name}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("order_items")}</p>
                <ScrollArea className="h-48 border border-white/10 rounded-lg">
                  <div className="p-3 space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-mono">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Totals */}
              <div className="space-y-2 p-3 bg-secondary/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>{t("subtotal")}</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("tax")}</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-white/10">
                  <span>{t("total")}</span>
                  <span className="font-mono text-primary">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-sm text-yellow-500">
                    <strong>Not:</strong> {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {!selectedOrder.is_paid && selectedOrder.status !== "cancelled" && (
                <div className="flex gap-2">
                  {selectedOrder.status === "pending" && (
                    <Button
                      className="flex-1"
                      onClick={() => updateOrderStatus(selectedOrder.id, "preparing")}
                      data-testid="dialog-start-preparing"
                    >
                      {t("start_preparing")}
                    </Button>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <Button
                      className="flex-1"
                      onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                      data-testid="dialog-mark-ready"
                    >
                      {t("mark_ready")}
                    </Button>
                  )}
                  {selectedOrder.status === "ready" && (
                    <Button
                      className="flex-1"
                      onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                      data-testid="dialog-mark-delivered"
                    >
                      {t("mark_delivered")}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                    data-testid="dialog-cancel-order"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
