import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Settings as SettingsIcon, Globe, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { get, put } = useApi();

  const [settings, setSettings] = useState({
    business_name: "",
    business_address: "",
    business_phone: "",
    business_email: "",
    tax_number: "",
    default_tax_rate: 18,
    currency: "TRY",
    default_language: "tr",
    receipt_footer: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const result = await get("/settings");
    if (result.success) {
      setSettings(result.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await put("/settings", settings);
    if (result.success) {
      toast.success(t("saved_successfully"));
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setSettings({ ...settings, default_language: lang });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
            <p className="text-muted-foreground mt-1">İşletme ve uygulama ayarlarını yönetin</p>
          </div>

          <Button onClick={handleSave} disabled={saving} data-testid="save-settings-btn">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t("save")}
          </Button>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Business Information */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t("business_name")}</CardTitle>
                  <CardDescription>İşletme bilgilerini fiş ve raporlarda kullanılır</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("business_name")}</Label>
                  <Input
                    value={settings.business_name}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                    placeholder="İşletme adı"
                    data-testid="settings-business-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("business_phone")}</Label>
                  <Input
                    value={settings.business_phone}
                    onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                    placeholder="+90 xxx xxx xx xx"
                    data-testid="settings-business-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("business_address")}</Label>
                <Input
                  value={settings.business_address}
                  onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                  placeholder="İşletme adresi"
                  data-testid="settings-business-address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("business_email")}</Label>
                  <Input
                    type="email"
                    value={settings.business_email}
                    onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                    placeholder="email@example.com"
                    data-testid="settings-business-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("tax_number")}</Label>
                  <Input
                    value={settings.tax_number}
                    onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
                    placeholder="Vergi numarası"
                    data-testid="settings-tax-number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Genel Ayarlar</CardTitle>
                  <CardDescription>Vergi, para birimi ve dil ayarları</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("default_tax_rate")} (%)</Label>
                  <Input
                    type="number"
                    value={settings.default_tax_rate}
                    onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) || 0 })}
                    data-testid="settings-tax-rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("currency")}</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(v) => setSettings({ ...settings, currency: v })}
                  >
                    <SelectTrigger data-testid="settings-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY (₺)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("language")}</Label>
                  <Select
                    value={language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger data-testid="settings-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("receipt_footer")}</Label>
                <Textarea
                  value={settings.receipt_footer}
                  onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                  placeholder="Fişin alt kısmında görünecek mesaj"
                  rows={3}
                  data-testid="settings-receipt-footer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Language Preview */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t("language")}</CardTitle>
                  <CardDescription>Uygulama dil tercihini değiştirin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={language === "tr" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("tr")}
                  className="flex-1"
                  data-testid="lang-tr-btn"
                >
                  🇹🇷 Türkçe
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("en")}
                  className="flex-1"
                  data-testid="lang-en-btn"
                >
                  🇬🇧 English
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
