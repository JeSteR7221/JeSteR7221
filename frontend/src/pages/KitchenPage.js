import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import { formatTime, getElapsedTime } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import {
  ChefHat,
  Clock,
  CheckCircle,
  Loader2,
  Volume2,
  VolumeX,
  RefreshCw,
  UtensilsCrossed,
  ShoppingBag,
  Package,
} from "lucide-react";

const orderTypeIcons = {
  dine_in: UtensilsCrossed,
  takeaway: ShoppingBag,
  delivery: Package,
};

export default function KitchenPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { get, put } = useApi();
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch branches
  useEffect(() => {
    fetchBranches();
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleykPXJ3B2LJhFQlOnLnXtGsZC0WVstK2byIRPYyrzLhzJRQ7hqTGunggGDqCn8C8eSUcOX6avb18KB44epe6vn4rIDd1lLe/gC0kNnGRtL+CLiU1bY6yv4MvJjVqjLC/hDAoNG+Osb+DMSU0bI6xv4QxJjRsjrG/hDEmNGyOsb+EMSY0bI6xv4QxJjRsjrG/hDEmNGyOsb+EMiY0bI6xv4QyJjRsjrG/hDImNGyOsb+EMiY0bI6xv4QyJjRsjrG/hDImNGyOsb+EMiY0bI6xv4QyJjRsjrG/hDImNGyOsb+EMiY0");
  }, []);

  // Setup WebSocket
  useEffect(() => {
    if (selectedBranch) {
      fetchOrders();
      setupWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedBranch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedBranch) fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      const userBranch = result.data.find((b) => b.id === user?.branch_id);
      setSelectedBranch(userBranch?.id || result.data[0].id);
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    const result = await get("/orders", {
      branch_id: selectedBranch,
      is_paid: false,
    });
    if (result.success) {
      // Filter only pending/preparing orders and sort by creation time
      const activeOrders = result.data
        .filter((o) => ["pending", "preparing", "ready"].includes(o.status))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setOrders(activeOrders);
    }
  };

  const setupWebSocket = () => {
    const wsUrl = process.env.REACT_APP_BACKEND_URL
      .replace("https://", "wss://")
      .replace("http://", "ws://");
    
    wsRef.current = new WebSocket(`${wsUrl}/ws/kitchen/${selectedBranch}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "new_order") {
        setOrders((prev) => [...prev, data.order].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ));
        playSound();
        toast.success(`${t("new_orders")} #${data.order.order_number}`);
      } else if (data.type === "order_updated" || data.type === "order_status_changed") {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o))
            .filter((o) => ["pending", "preparing", "ready"].includes(o.status))
        );
      } else if (data.type === "order_paid") {
        setOrders((prev) => prev.filter((o) => o.id !== data.order_id));
      }
    };

    wsRef.current.onerror = () => {
      console.log("WebSocket error, falling back to polling");
    };

    wsRef.current.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (selectedBranch) setupWebSocket();
      }, 5000);
    };
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const result = await put(`/orders/${orderId}/status?status=${status}`);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
          .filter((o) => ["pending", "preparing", "ready"].includes(o.status))
      );
      
      if (status === "ready") {
        playSound();
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500";
      case "preparing":
        return "bg-blue-500/20 text-blue-500 border-blue-500";
      case "ready":
        return "bg-green-500/20 text-green-500 border-green-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getElapsedClass = (createdAt) => {
    const elapsed = (new Date() - new Date(createdAt)) / 1000 / 60; // minutes
    if (elapsed > 15) return "text-red-500";
    if (elapsed > 10) return "text-yellow-500";
    return "text-muted-foreground";
  };

  // Group orders by status
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("kitchen")}</h1>
            <p className="text-muted-foreground">
              {orders.length} {t("orders")} aktif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {branches.length > 1 && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48 bg-card" data-testid="kitchen-branch-select">
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
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            data-testid="sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchOrders}
            data-testid="refresh-orders"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <h2 className="text-lg font-semibold">{t("pending")}</h2>
            <Badge variant="secondary">{pendingOrders.length}</Badge>
          </div>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                t={t}
                language={language}
                onStatusChange={updateOrderStatus}
                getStatusColor={getStatusColor}
                getElapsedClass={getElapsedClass}
              />
            ))}
          </div>
        </div>

        {/* Preparing Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold">{t("preparing")}</h2>
            <Badge variant="secondary">{preparingOrders.length}</Badge>
          </div>
          <div className="space-y-4">
            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                t={t}
                language={language}
                onStatusChange={updateOrderStatus}
                getStatusColor={getStatusColor}
                getElapsedClass={getElapsedClass}
              />
            ))}
          </div>
        </div>

        {/* Ready Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h2 className="text-lg font-semibold">{t("ready")}</h2>
            <Badge variant="secondary">{readyOrders.length}</Badge>
          </div>
          <div className="space-y-4">
            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                t={t}
                language={language}
                onStatusChange={updateOrderStatus}
                getStatusColor={getStatusColor}
                getElapsedClass={getElapsedClass}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <ChefHat className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t("no_data")}</p>
          <p className="text-sm">Yeni siparişler burada görünecek</p>
        </div>
      )}
    </div>
  );
}

// Order Card Component
function OrderCard({ order, t, language, onStatusChange, getStatusColor, getElapsedClass }) {
  const [elapsedTime, setElapsedTime] = useState(getElapsedTime(order.created_at));
  const OrderTypeIcon = orderTypeIcons[order.order_type] || UtensilsCrossed;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime(order.created_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  return (
    <div
      className={`kds-card ${order.status}`}
      data-testid={`order-card-${order.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono">#{order.order_number}</span>
          <OrderTypeIcon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${getElapsedClass(order.created_at)}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono">{elapsedTime}</span>
        </div>
      </div>

      {/* Table/Type Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {order.table_number && (
          <Badge variant="outline">{t("table_number")} {order.table_number}</Badge>
        )}
        <Badge variant="outline">{t(order.order_type)}</Badge>
        {order.is_qr_order && <Badge variant="secondary">QR</Badge>}
      </div>

      {/* Items */}
      <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-start">
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">{item.quantity}x</span>
              <span>{item.product_name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-3 p-2 bg-yellow-500/10 rounded text-sm text-yellow-500">
          <strong>Not:</strong> {order.notes}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-white/10">
        {order.status === "pending" && (
          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            onClick={() => onStatusChange(order.id, "preparing")}
            data-testid={`start-preparing-${order.id}`}
          >
            <ChefHat className="w-5 h-5 mr-2" />
            {t("start_preparing")}
          </Button>
        )}
        {order.status === "preparing" && (
          <Button
            className="w-full h-12 bg-green-600 hover:bg-green-700"
            onClick={() => onStatusChange(order.id, "ready")}
            data-testid={`mark-ready-${order.id}`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {t("mark_ready")}
          </Button>
        )}
        {order.status === "ready" && (
          <Button
            className="w-full h-12"
            variant="outline"
            onClick={() => onStatusChange(order.id, "delivered")}
            data-testid={`mark-delivered-${order.id}`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {t("mark_delivered")}
          </Button>
        )}
      </div>
    </div>
  );
}
