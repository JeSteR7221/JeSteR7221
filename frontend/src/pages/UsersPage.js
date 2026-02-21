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
import { Loader2, Pencil, Trash2, Users } from "lucide-react";

export default function UsersPage() {
  const { t } = useLanguage();
  const { get, post, put, del } = useApi();

  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
    branch_id: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [usersResult, branchesResult] = await Promise.all([
      get("/users"),
      get("/branches"),
    ]);
    if (usersResult.success) setUsers(usersResult.data);
    if (branchesResult.success) setBranches(branchesResult.data);
    setLoading(false);
  };

  const openDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        branch_id: user.branch_id || "",
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "cashier",
        branch_id: branches[0]?.id || "",
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("Lütfen şifre girin");
      return;
    }

    setSaving(true);
    
    const data = { ...formData };
    if (!data.password) delete data.password;
    if (!data.branch_id) delete data.branch_id;

    let result;
    if (editingUser) {
      result = await put(`/users/${editingUser.id}`, data);
    } else {
      result = await post("/auth/register", data);
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

  const handleDelete = async (userId) => {
    if (!window.confirm(t("are_you_sure"))) return;
    
    const result = await del(`/users/${userId}`);
    if (result.success) {
      toast.success(t("deleted_successfully"));
      fetchData();
    } else {
      toast.error(result.error);
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: "bg-purple-500/20 text-purple-500",
      cashier: "bg-blue-500/20 text-blue-500",
      kitchen: "bg-green-500/20 text-green-500",
    };
    return variants[role] || "bg-gray-500/20";
  };

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || "-";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("users")}</h1>

          <Button onClick={() => openDialog()} data-testid="add-user-btn">
            <Users className="w-4 h-4 mr-2" />
            {t("add_user")}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <Card className="bg-card border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("no_data")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card
                key={user.id}
                className="bg-card border-white/5 card-hover"
                data-testid={`user-card-${user.id}`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {user.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={getRoleBadge(user.role)}>
                      {t(user.role)}
                    </Badge>
                    
                    {user.branch_id && (
                      <span className="text-sm text-muted-foreground">
                        {getBranchName(user.branch_id)}
                      </span>
                    )}

                    {!user.is_active && (
                      <Badge variant="destructive">{t("inactive")}</Badge>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(user)}
                        data-testid={`edit-user-${user.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        data-testid={`delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t("edit_user") : t("add_user")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("user_name")} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ad Soyad"
                data-testid="user-name"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("email")} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                data-testid="user-email"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("password")} {!editingUser && "*"}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Değiştirmek için yeni şifre" : "Şifre"}
                data-testid="user-password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("user_role")}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger data-testid="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("admin")}</SelectItem>
                    <SelectItem value="cashier">{t("cashier")}</SelectItem>
                    <SelectItem value="kitchen">{t("kitchen_staff")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Şube</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(v) => setFormData({ ...formData, branch_id: v })}
                >
                  <SelectTrigger data-testid="user-branch">
                    <SelectValue placeholder="Seçin" />
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

            <div className="flex items-center justify-between">
              <Label>{t("active")}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                data-testid="user-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-user-btn">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
