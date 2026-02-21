import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Building2 } from "lucide-react";

export default function BranchesPage() {
  const { t } = useLanguage();
  const { get, post, put, del } = useApi();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    tax_rate: 18,
    currency: "TRY",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    const result = await get("/branches");
    if (result.success) {
      setBranches(result.data);
    }
    setLoading(false);
  };

  const openDialog = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        tax_rate: branch.tax_rate,
        currency: branch.currency,
        is_active: branch.is_active,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        tax_rate: 18,
        currency: "TRY",
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Lütfen şube adını girin");
      return;
    }

    setSaving(true);
    let result;
    if (editingBranch) {
      result = await put(`/branches/${editingBranch.id}`, formData);
    } else {
      result = await post("/branches", formData);
    }

    if (result.success) {
      toast.success(t("saved_successfully"));
      setShowDialog(false);
      fetchBranches();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm(t("are_you_sure"))) return;
    
    const result = await del(`/branches/${branchId}`);
    if (result.success) {
      toast.success(t("deleted_successfully"));
      fetchBranches();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("branches")}</h1>

          <Button onClick={() => openDialog()} data-testid="add-branch-btn">
            <Plus className="w-4 h-4 mr-2" />
            {t("add_branch")}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : branches.length === 0 ? (
          <Card className="bg-card border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("no_data")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className="bg-card border-white/5 card-hover"
                data-testid={`branch-card-${branch.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    {!branch.is_active && (
                      <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded">
                        {t("inactive")}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{branch.address}</p>
                  <p className="text-sm text-muted-foreground mb-4">{branch.phone}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>KDV: %{branch.tax_rate}</span>
                    <span>{branch.currency}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog(branch)}
                      data-testid={`edit-branch-${branch.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(branch.id)}
                      data-testid={`delete-branch-${branch.id}`}
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

      {/* Branch Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? t("edit_branch") : t("add_branch")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("branch_name")} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Şube adı"
                data-testid="branch-name"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("branch_address")}</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adres"
                data-testid="branch-address"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("branch_phone")}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 xxx xxx xx xx"
                data-testid="branch-phone"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("branch_tax_rate")} (%)</Label>
                <Input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  data-testid="branch-tax-rate"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("currency")}</Label>
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="TRY"
                  data-testid="branch-currency"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("active")}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                data-testid="branch-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-branch-btn">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
