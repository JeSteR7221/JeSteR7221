import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Grid3X3 } from "lucide-react";

export default function CategoriesPage() {
  const { t, language } = useLanguage();
  const { get, post, put, del } = useApi();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    description: "",
    image_url: "",
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchCategories();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      setSelectedBranch(result.data[0].id);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    const result = await get("/categories", { branch_id: selectedBranch });
    if (result.success) {
      setCategories(result.data);
    }
    setLoading(false);
  };

  const openDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        name_en: category.name_en || "",
        description: category.description || "",
        image_url: category.image_url || "",
        sort_order: category.sort_order || 0,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        name_en: "",
        description: "",
        image_url: "",
        sort_order: categories.length,
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Lütfen kategori adını girin");
      return;
    }

    setSaving(true);
    const data = {
      ...formData,
      branch_id: selectedBranch,
    };

    let result;
    if (editingCategory) {
      result = await put(`/categories/${editingCategory.id}`, data);
    } else {
      result = await post("/categories", data);
    }

    if (result.success) {
      toast.success(t("saved_successfully"));
      setShowDialog(false);
      fetchCategories();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm(t("are_you_sure"))) return;
    
    const result = await del(`/categories/${categoryId}`);
    if (result.success) {
      toast.success(t("deleted_successfully"));
      fetchCategories();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("categories")}</h1>

          <div className="flex items-center gap-3">
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

            <Button onClick={() => openDialog()} data-testid="add-category-btn">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_category")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <Card className="bg-card border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Grid3X3 className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("no_data")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="bg-card border-white/5 overflow-hidden card-hover"
                data-testid={`category-card-${category.id}`}
              >
                <div
                  className="h-32 bg-cover bg-center relative"
                  style={{
                    backgroundImage: category.image_url
                      ? `url(${category.image_url})`
                      : "linear-gradient(to br, hsl(var(--secondary)), hsl(var(--background)))",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-lg font-bold text-white">
                      {language === "en" && category.name_en ? category.name_en : category.name}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      Sıra: {category.sort_order}
                    </span>
                    {!category.is_active && (
                      <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded">
                        {t("inactive")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog(category)}
                      data-testid={`edit-category-${category.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      data-testid={`delete-category-${category.id}`}
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

      {/* Category Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t("edit_category") : t("add_category")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("category_name")} (TR) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kategori adı"
                  data-testid="category-name-tr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("category_name")} (EN)</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Category name"
                  data-testid="category-name-en"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("product_description")}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Açıklama"
                data-testid="category-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("product_image")}</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  data-testid="category-image"
                />
              </div>
              <div className="space-y-2">
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  data-testid="category-sort"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("active")}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                data-testid="category-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-category-btn">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
