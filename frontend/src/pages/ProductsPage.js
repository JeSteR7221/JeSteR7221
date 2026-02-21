import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import { formatCurrency } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search, Package } from "lucide-react";

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const { get, post, put, del } = useApi();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    price: "",
    category_id: "",
    image_url: "",
    stock: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

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
      setSelectedBranch(result.data[0].id);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [catResult, prodResult] = await Promise.all([
      get("/categories", { branch_id: selectedBranch }),
      get("/products", { branch_id: selectedBranch }),
    ]);
    if (catResult.success) setCategories(catResult.data);
    if (prodResult.success) setProducts(prodResult.data);
    setLoading(false);
  };

  const openDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        name_en: product.name_en || "",
        description: product.description || "",
        description_en: product.description_en || "",
        price: product.price.toString(),
        category_id: product.category_id,
        image_url: product.image_url || "",
        stock: product.stock?.toString() || "",
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        name_en: "",
        description: "",
        description_en: "",
        price: "",
        category_id: categories[0]?.id || "",
        image_url: "",
        stock: "",
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setSaving(true);
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      stock: formData.stock ? parseInt(formData.stock) : null,
      branch_id: selectedBranch,
    };

    let result;
    if (editingProduct) {
      result = await put(`/products/${editingProduct.id}`, data);
    } else {
      result = await post("/products", data);
    }

    if (result.success) {
      toast.success(t("saved_successfully"));
      setShowDialog(false);
      fetchData();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(t("are_you_sure"))) return;
    
    const result = await del(`/products/${productId}`);
    if (result.success) {
      toast.success(t("deleted_successfully"));
      fetchData();
    } else {
      toast.error(result.error);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return language === "en" && cat?.name_en ? cat.name_en : cat?.name || "-";
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_en?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("products")}</h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
                data-testid="products-search"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="category-filter">
                <SelectValue placeholder={t("all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === "en" && cat.name_en ? cat.name_en : cat.name}
                  </SelectItem>
                ))}
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

            <Button onClick={() => openDialog()} data-testid="add-product-btn">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_product")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-card border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("no_data")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="bg-card border-white/5 overflow-hidden card-hover"
                data-testid={`product-card-${product.id}`}
              >
                <div
                  className="h-32 bg-cover bg-center"
                  style={{
                    backgroundImage: product.image_url
                      ? `url(${product.image_url})`
                      : "linear-gradient(to br, hsl(var(--secondary)), hsl(var(--background)))",
                  }}
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold line-clamp-1">
                        {language === "en" && product.name_en ? product.name_en : product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(product.category_id)}
                      </p>
                    </div>
                    {!product.is_active && (
                      <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded">
                        {t("inactive")}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xl font-bold font-mono text-primary mb-3">
                    {formatCurrency(product.price)}
                  </p>

                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog(product)}
                      data-testid={`edit-product-${product.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      data-testid={`delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t("edit_product") : t("add_product")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("product_name")} (TR) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ürün adı"
                  data-testid="product-name-tr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("product_name")} (EN)</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Product name"
                  data-testid="product-name-en"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("product_price")} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  data-testid="product-price"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("product_category")} *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
                  <SelectTrigger data-testid="product-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("product_description")} (TR)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ürün açıklaması"
                data-testid="product-description-tr"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("product_description")} (EN)</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Product description"
                data-testid="product-description-en"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("product_image")}</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  data-testid="product-image"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("product_stock")}</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Opsiyonel"
                  data-testid="product-stock"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("active")}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                data-testid="product-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-product-btn">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
