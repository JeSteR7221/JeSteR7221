import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Utensils, Users } from "lucide-react";

export default function TablesPage() {
  const { t } = useLanguage();
  const { get, post, put, del } = useApi();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    capacity: 4,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchTables();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const result = await get("/branches");
    if (result.success && result.data.length > 0) {
      setBranches(result.data);
      setSelectedBranch(result.data[0].id);
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    const result = await get("/tables", { branch_id: selectedBranch });
    if (result.success) {
      setTables(result.data);
    }
    setLoading(false);
  };

  const openDialog = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        is_active: table.is_active,
      });
    } else {
      setEditingTable(null);
      const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
      setFormData({
        number: nextNumber,
        name: `Masa ${nextNumber}`,
        capacity: 4,
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.number || !formData.name) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setSaving(true);
    const data = {
      ...formData,
      number: parseInt(formData.number),
      branch_id: selectedBranch,
    };

    let result;
    if (editingTable) {
      result = await put(`/tables/${editingTable.id}`, data);
    } else {
      result = await post("/tables", data);
    }

    if (result.success) {
      toast.success(t("saved_successfully"));
      setShowDialog(false);
      fetchTables();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm(t("are_you_sure"))) return;
    
    const result = await del(`/tables/${tableId}`);
    if (result.success) {
      toast.success(t("deleted_successfully"));
      fetchTables();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("tables")}</h1>

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

            <Button onClick={() => openDialog()} data-testid="add-table-btn">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_table")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tables.length === 0 ? (
          <Card className="bg-card border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Utensils className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("no_data")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="table-grid">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`bg-card border-white/5 overflow-hidden card-hover ${
                  table.is_occupied ? "border-yellow-500/50" : ""
                }`}
                data-testid={`table-card-${table.id}`}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[160px]">
                  <span className="text-3xl font-bold mb-2">{table.number}</span>
                  <span className="text-sm text-muted-foreground mb-2">{table.name}</span>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Users className="w-4 h-4" />
                    <span>{table.capacity}</span>
                  </div>

                  <Badge
                    variant={table.is_occupied ? "destructive" : "secondary"}
                    className="mb-3"
                  >
                    {table.is_occupied ? t("occupied") : t("available")}
                  </Badge>

                  {!table.is_active && (
                    <Badge variant="outline" className="mb-3 text-destructive border-destructive">
                      {t("inactive")}
                    </Badge>
                  )}

                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog(table)}
                      data-testid={`edit-table-${table.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(table.id)}
                      disabled={table.is_occupied}
                      data-testid={`delete-table-${table.id}`}
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

      {/* Table Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingTable ? t("edit_table") : t("add_table")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Masa No *</Label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  data-testid="table-number"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("table_capacity")}</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  data-testid="table-capacity"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("table_name")} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masa adı"
                data-testid="table-name"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("active")}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                data-testid="table-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-table-btn">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
