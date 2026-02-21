import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import { formatCurrency, formatTime, getElapsedTime } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Send,
  CreditCard,
  Banknote,
  Loader2,
  X,
  Receipt,
} from "lucide-react";

export default function POSPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { get, post } = useApi();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState("dine_in");
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showTableSelect, setShowTableSelect] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchData();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      const userBranch = result.data.find((b) => b.id === user?.branch_id);
      setSelectedBranch(userBranch?.id || result.data[0].id);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [catResult, prodResult, tableResult] = await Promise.all([
      get("/categories", { branch_id: selectedBranch }),
      get("/products", { branch_id: selectedBranch, is_active: true }),
      get("/tables", { branch_id: selectedBranch }),
    ]);

    if (catResult.success) setCategories(catResult.data);
    if (prodResult.success) setProducts(prodResult.data);
    if (tableResult.success) setTables(tableResult.data);
    setLoading(false);
  };

  // Get selected branch details
  const currentBranch = branches.find((b) => b.id === selectedBranch);
  const taxRate = currentBranch?.tax_rate || 18;

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const changeAmount = cashAmount ? parseFloat(cashAmount) - total : 0;

  // Filter products by category
  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category_id === selectedCategory);

  // Add item to cart
  const addToCart = useCallback((product) => {
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
  }, [language]);

  // Update item quantity
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

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedTable(null);
    setOrderNote("");
  };

  // Select table
  const handleTableSelect = (table) => {
    if (!table.is_occupied) {
      setSelectedTable(table);
      setShowTableSelect(false);
    }
  };

  // Send order to kitchen
  const sendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error(t("empty_cart"));
      return;
    }

    if (orderType === "dine_in" && !selectedTable) {
      toast.error(t("select_table"));
      setShowTableSelect(true);
      return;
    }

    setProcessing(true);

    const orderData = {
      branch_id: selectedBranch,
      table_id: orderType === "dine_in" ? selectedTable?.id : null,
      table_number: orderType === "dine_in" ? selectedTable?.number : null,
      order_type: orderType,
      items: cart,
      subtotal,
      tax_amount: taxAmount,
      total,
      notes: orderNote,
    };

    const result = await post("/orders", orderData);

    if (result.success) {
      toast.success(t("send_to_kitchen") + " ✓");
      clearCart();
    } else {
      toast.error(result.error);
    }

    setProcessing(false);
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      toast.error(t("empty_cart"));
      return;
    }

    if (orderType === "dine_in" && !selectedTable) {
      toast.error(t("select_table"));
      return;
    }

    setProcessing(true);

    // First create order
    const orderData = {
      branch_id: selectedBranch,
      table_id: orderType === "dine_in" ? selectedTable?.id : null,
      table_number: orderType === "dine_in" ? selectedTable?.number : null,
      order_type: orderType,
      items: cart,
      subtotal,
      tax_amount: taxAmount,
      total,
      notes: orderNote,
    };

    const orderResult = await post("/orders", orderData);

    if (!orderResult.success) {
      toast.error(orderResult.error);
      setProcessing(false);
      return;
    }

    // Then process payment
    const paymentData = {
      order_id: orderResult.data.id,
      payment_method: paymentMethod,
      cash_amount: paymentMethod === "cash" ? parseFloat(cashAmount) || total : null,
      card_amount: paymentMethod === "card" ? total : null,
      change_amount: paymentMethod === "cash" ? Math.max(0, changeAmount) : 0,
    };

    const paymentResult = await post("/payments", paymentData);

    if (paymentResult.success) {
      toast.success(t("paid") + " ✓");
      clearCart();
      setShowPayment(false);
      setCashAmount("");
    } else {
      toast.error(paymentResult.error);
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Section - Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Lumina POS</h1>
              <p className="text-sm text-muted-foreground">{currentBranch?.name}</p>
            </div>
          </div>

          {branches.length > 1 && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48" data-testid="pos-branch-select">
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
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-white/5 bg-card/50">
          <ScrollArea className="w-full">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`category-tab ${selectedCategory === "all" ? "active" : ""}`}
                data-testid="category-all"
              >
                {t("all")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
                  data-testid={`category-${cat.id}`}
                >
                  {language === "en" && cat.name_en ? cat.name_en : cat.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="pos-grid">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="pos-item"
                style={{
                  backgroundImage: product.image_url
                    ? `url(${product.image_url})`
                    : "linear-gradient(to br, hsl(var(--secondary)), hsl(var(--background)))",
                }}
                data-testid={`product-${product.id}`}
              >
                <div>
                  <p className="font-semibold text-white line-clamp-2">
                    {language === "en" && product.name_en ? product.name_en : product.name}
                  </p>
                  <p className="text-primary font-bold font-mono mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Section - Ticket/Cart */}
      <div className="w-96 flex flex-col bg-card border-l border-white/5">
        {/* Ticket Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("cart")}</h2>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
                data-testid="clear-cart-btn"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t("clear_cart")}
              </Button>
            )}
          </div>

          {/* Order Type */}
          <div className="flex gap-2">
            {[
              { value: "dine_in", icon: UtensilsCrossed, label: t("dine_in") },
              { value: "takeaway", icon: ShoppingBag, label: t("takeaway") },
              { value: "delivery", icon: Package, label: t("delivery") },
            ].map((type) => (
              <Button
                key={type.value}
                variant={orderType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setOrderType(type.value);
                  if (type.value !== "dine_in") setSelectedTable(null);
                }}
                className="flex-1"
                data-testid={`order-type-${type.value}`}
              >
                <type.icon className="w-4 h-4 mr-1" />
                {type.label}
              </Button>
            ))}
          </div>

          {/* Table Selection */}
          {orderType === "dine_in" && (
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setShowTableSelect(true)}
              data-testid="select-table-btn"
            >
              {selectedTable
                ? `${t("table_number")} ${selectedTable.number} - ${selectedTable.name}`
                : t("select_table")}
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="empty-state py-12">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-50" />
                <p>{t("empty_cart")}</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3 p-3 bg-background/50 rounded-lg"
                  data-testid={`cart-item-${item.product_id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      data-testid={`decrease-${item.product_id}`}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-mono">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      data-testid={`increase-${item.product_id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.product_id)}
                      data-testid={`remove-${item.product_id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Order Note */}
        {cart.length > 0 && (
          <div className="px-4 pb-2">
            <Input
              placeholder={t("add_note")}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="bg-background/50"
              data-testid="order-note-input"
            />
          </div>
        )}

        {/* Ticket Footer */}
        <div className="p-4 border-t border-white/5 bg-background/50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("tax")} (%{taxRate})</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
              <span>{t("total")}</span>
              <span className="font-mono text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-14 btn-pos bg-secondary hover:bg-secondary/80"
              onClick={sendToKitchen}
              disabled={cart.length === 0 || processing}
              data-testid="send-to-kitchen-btn"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {t("send_to_kitchen")}
                </>
              )}
            </Button>
            <Button
              className="h-14 btn-pos bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0 || processing}
              data-testid="pay-btn"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {t("pay")}
            </Button>
          </div>
        </div>
      </div>

      {/* Table Selection Dialog */}
      <Dialog open={showTableSelect} onOpenChange={setShowTableSelect}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("select_table")}</DialogTitle>
          </DialogHeader>
          <div className="table-grid py-4">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table)}
                className={`table-card ${table.is_occupied ? "occupied" : ""} ${
                  selectedTable?.id === table.id ? "selected" : ""
                }`}
                disabled={table.is_occupied}
                data-testid={`table-${table.id}`}
              >
                <span className="text-2xl font-bold">{table.number}</span>
                <span className="text-sm text-muted-foreground">{table.name}</span>
                <Badge variant={table.is_occupied ? "destructive" : "secondary"} className="text-xs">
                  {table.is_occupied ? t("occupied") : t("available")}
                </Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pay")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className="h-16"
                onClick={() => setPaymentMethod("cash")}
                data-testid="payment-cash"
              >
                <Banknote className="w-6 h-6 mr-2" />
                {t("cash")}
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className="h-16"
                onClick={() => setPaymentMethod("card")}
                data-testid="payment-card"
              >
                <CreditCard className="w-6 h-6 mr-2" />
                {t("card")}
              </Button>
            </div>

            {/* Cash Amount Input */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Alınan Tutar</label>
                <Input
                  type="number"
                  placeholder={formatCurrency(total)}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="h-14 text-xl font-mono"
                  data-testid="cash-amount-input"
                />
                {changeAmount > 0 && (
                  <p className="text-sm text-success">
                    Para Üstü: <span className="font-mono font-bold">{formatCurrency(changeAmount)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("tax")}</span>
                <span className="font-mono">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                <span>{t("total")}</span>
                <span className="font-mono text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={processPayment}
              disabled={processing || (paymentMethod === "cash" && parseFloat(cashAmount) < total)}
              className="bg-primary"
              data-testid="confirm-payment-btn"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Receipt className="w-5 h-5 mr-2" />
                  {t("confirm")} {formatCurrency(total)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
