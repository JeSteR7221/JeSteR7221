import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { formatCurrency } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Send,
  Loader2,
  CheckCircle,
  Globe,
  UtensilsCrossed,
} from "lucide-react";

export default function QRMenuPage() {
  const { branchId, tableId } = useParams();
  const { get, post } = useApi();

  const [language, setLanguage] = useState("tr");
  const [menuData, setMenuData] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [branchId, tableId]);

  const fetchData = async () => {
    setLoading(true);
    const [menuResult, tableResult] = await Promise.all([
      get(`/qr/menu/${branchId}`),
      tableId ? get(`/qr/table/${tableId}`) : Promise.resolve({ success: true, data: null }),
    ]);

    if (menuResult.success) {
      setMenuData(menuResult.data);
    }
    if (tableResult.success) {
      setTableInfo(tableResult.data);
    }
    setLoading(false);
  };

  const t = (tr, en) => (language === "tr" ? tr : en);

  // Cart calculations
  const taxRate = menuData?.branch?.tax_rate || 18;
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Filter products
  const filteredProducts = selectedCategory === "all"
    ? menuData?.products || []
    : (menuData?.products || []).filter((p) => p.category_id === selectedCategory);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: language === "en" && product.name_en ? product.name_en : product.name,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
                total_price: Math.max(0, item.quantity + delta) * item.unit_price,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("Sepet boş", "Cart is empty"));
      return;
    }

    if (!tableId) {
      toast.error(t("Masa bilgisi bulunamadı", "Table not found"));
      return;
    }

    setSubmitting(true);
    const orderData = {
      branch_id: branchId,
      table_id: tableId,
      items: cart,
      customer_notes: orderNote,
    };

    const result = await post("/qr/order", orderData);

    if (result.success) {
      setOrderSent(true);
      setCart([]);
      toast.success(t("Siparişiniz alındı!", "Order received!"));
    } else {
      toast.error(result.error);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("Menü bulunamadı", "Menu not found")}</p>
      </div>
    );
  }

  if (orderSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-fade-in">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("Siparişiniz Alındı!", "Order Received!")}</h1>
        <p className="text-muted-foreground mb-6">
          {t(
            "Siparişiniz mutfağa iletildi. En kısa sürede hazırlanacaktır.",
            "Your order has been sent to the kitchen. It will be ready soon."
          )}
        </p>
        {tableInfo && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {t("Masa", "Table")} {tableInfo.number}
          </Badge>
        )}
        <Button
          className="mt-8"
          onClick={() => setOrderSent(false)}
          data-testid="new-order-btn"
        >
          {t("Yeni Sipariş Ver", "Place New Order")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div
        className="h-48 bg-cover bg-center relative"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/8093532/pexels-photo-8093532.jpeg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{menuData.branch?.name}</h1>
            {tableInfo && (
              <Badge className="mt-2 bg-primary text-primary-foreground">
                <UtensilsCrossed className="w-3 h-3 mr-1" />
                {t("Masa", "Table")} {tableInfo.number}
              </Badge>
            )}
          </div>
          <button
            onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-full text-white"
            data-testid="qr-lang-toggle"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-white/5 p-4">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`category-tab ${selectedCategory === "all" ? "active" : ""}`}
              data-testid="qr-category-all"
            >
              {t("Tümü", "All")}
            </button>
            {menuData.categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
                data-testid={`qr-category-${cat.id}`}
              >
                {language === "en" && cat.name_en ? cat.name_en : cat.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Products */}
      <div className="p-4 space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="qr-menu-item flex overflow-hidden"
            data-testid={`qr-product-${product.id}`}
          >
            <div
              className="w-28 h-28 bg-cover bg-center flex-shrink-0"
              style={{
                backgroundImage: product.image_url
                  ? `url(${product.image_url})`
                  : "linear-gradient(to br, hsl(var(--secondary)), hsl(var(--background)))",
              }}
            />
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold">
                  {language === "en" && product.name_en ? product.name_en : product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {language === "en" && product.description_en
                      ? product.description_en
                      : product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-primary font-mono">
                  {formatCurrency(product.price)}
                </span>
                <Button
                  size="sm"
                  onClick={() => addToCart(product)}
                  data-testid={`qr-add-${product.id}`}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("Ekle", "Add")}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-white/10 p-4 glass animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">
              {t("Sepetiniz", "Your Cart")} ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </span>
            <span className="text-lg font-bold text-primary font-mono">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Cart Items */}
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{item.product_name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.product_id, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.product_id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Note */}
          <input
            type="text"
            placeholder={t("Sipariş notu...", "Order note...")}
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className="w-full p-3 mb-3 bg-background/50 border border-white/10 rounded-lg text-sm"
            data-testid="qr-order-note"
          />

          <Button
            className="w-full h-12 text-lg font-bold"
            onClick={submitOrder}
            disabled={submitting}
            data-testid="qr-submit-order"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                {t("Sipariş Ver", "Place Order")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
