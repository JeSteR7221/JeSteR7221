import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

// Translation strings
const translations = {
  tr: {
    // Common
    app_name: "Lumina POS",
    loading: "Yükleniyor...",
    save: "Kaydet",
    cancel: "İptal",
    delete: "Sil",
    edit: "Düzenle",
    add: "Ekle",
    search: "Ara",
    filter: "Filtrele",
    all: "Tümü",
    active: "Aktif",
    inactive: "Pasif",
    yes: "Evet",
    no: "Hayır",
    confirm: "Onayla",
    back: "Geri",
    close: "Kapat",
    
    // Auth
    login: "Giriş Yap",
    logout: "Çıkış Yap",
    email: "E-posta",
    password: "Şifre",
    login_title: "Lumina POS'a Hoş Geldiniz",
    login_subtitle: "Devam etmek için giriş yapın",
    login_error: "Geçersiz e-posta veya şifre",
    
    // Navigation
    dashboard: "Panel",
    pos: "POS",
    kitchen: "Mutfak",
    orders: "Siparişler",
    products: "Ürünler",
    categories: "Kategoriler",
    tables: "Masalar",
    branches: "Şubeler",
    users: "Kullanıcılar",
    reports: "Raporlar",
    settings: "Ayarlar",
    
    // POS
    select_table: "Masa Seçin",
    order_type: "Sipariş Türü",
    dine_in: "Masada",
    takeaway: "Paket",
    delivery: "Teslimat",
    cart: "Sepet",
    empty_cart: "Sepet boş",
    subtotal: "Ara Toplam",
    tax: "KDV",
    total: "Toplam",
    pay: "Ödeme Al",
    send_to_kitchen: "Mutfağa Gönder",
    clear_cart: "Sepeti Temizle",
    add_note: "Not Ekle",
    quantity: "Adet",
    
    // Kitchen
    new_orders: "Yeni Siparişler",
    preparing: "Hazırlanıyor",
    ready: "Hazır",
    table_number: "Masa",
    order_number: "Sipariş No",
    start_preparing: "Hazırlamaya Başla",
    mark_ready: "Hazır",
    mark_delivered: "Teslim Edildi",
    elapsed_time: "Geçen Süre",
    
    // Orders
    order_status: "Sipariş Durumu",
    pending: "Bekliyor",
    delivered: "Teslim Edildi",
    cancelled: "İptal",
    paid: "Ödendi",
    unpaid: "Ödenmedi",
    order_details: "Sipariş Detayları",
    order_items: "Ürünler",
    payment_method: "Ödeme Yöntemi",
    cash: "Nakit",
    card: "Kart",
    split_payment: "Bölünmüş Ödeme",
    
    // Products
    product_name: "Ürün Adı",
    product_price: "Fiyat",
    product_category: "Kategori",
    product_description: "Açıklama",
    product_image: "Görsel URL",
    product_stock: "Stok",
    add_product: "Ürün Ekle",
    edit_product: "Ürün Düzenle",
    top_sellers: "En Çok Satanlar",
    
    // Categories
    category_name: "Kategori Adı",
    add_category: "Kategori Ekle",
    edit_category: "Kategori Düzenle",
    
    // Tables
    table_name: "Masa Adı",
    table_capacity: "Kapasite",
    table_status: "Durum",
    occupied: "Dolu",
    available: "Boş",
    add_table: "Masa Ekle",
    edit_table: "Masa Düzenle",
    
    // Branches
    branch_name: "Şube Adı",
    branch_address: "Adres",
    branch_phone: "Telefon",
    branch_tax_rate: "KDV Oranı",
    add_branch: "Şube Ekle",
    edit_branch: "Şube Düzenle",
    
    // Users
    user_name: "Ad Soyad",
    user_role: "Rol",
    admin: "Yönetici",
    cashier: "Kasiyer",
    kitchen_staff: "Mutfak",
    add_user: "Kullanıcı Ekle",
    edit_user: "Kullanıcı Düzenle",
    
    // Reports
    daily_report: "Günlük Rapor",
    weekly_report: "Haftalık Rapor",
    monthly_report: "Aylık Rapor",
    total_revenue: "Toplam Ciro",
    total_orders: "Toplam Sipariş",
    cash_sales: "Nakit Satış",
    card_sales: "Kart Satış",
    staff_sales: "Personel Satışları",
    
    // Settings
    business_name: "İşletme Adı",
    business_address: "İşletme Adresi",
    business_phone: "İşletme Telefonu",
    business_email: "İşletme E-posta",
    tax_number: "Vergi Numarası",
    default_tax_rate: "Varsayılan KDV Oranı",
    currency: "Para Birimi",
    language: "Dil",
    receipt_footer: "Fiş Alt Bilgisi",
    
    // QR Menu
    qr_menu: "QR Menü",
    view_menu: "Menüyü Gör",
    place_order: "Sipariş Ver",
    your_order: "Siparişiniz",
    order_sent: "Siparişiniz alındı!",
    order_note: "Sipariş Notu",
    
    // Messages
    success: "Başarılı",
    error: "Hata",
    saved_successfully: "Başarıyla kaydedildi",
    deleted_successfully: "Başarıyla silindi",
    are_you_sure: "Emin misiniz?",
    operation_cannot_undone: "Bu işlem geri alınamaz",
    no_data: "Veri bulunamadı",
    connection_error: "Bağlantı hatası",
  },
  en: {
    // Common
    app_name: "Lumina POS",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    back: "Back",
    close: "Close",
    
    // Auth
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    login_title: "Welcome to Lumina POS",
    login_subtitle: "Sign in to continue",
    login_error: "Invalid email or password",
    
    // Navigation
    dashboard: "Dashboard",
    pos: "POS",
    kitchen: "Kitchen",
    orders: "Orders",
    products: "Products",
    categories: "Categories",
    tables: "Tables",
    branches: "Branches",
    users: "Users",
    reports: "Reports",
    settings: "Settings",
    
    // POS
    select_table: "Select Table",
    order_type: "Order Type",
    dine_in: "Dine In",
    takeaway: "Takeaway",
    delivery: "Delivery",
    cart: "Cart",
    empty_cart: "Cart is empty",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    pay: "Pay",
    send_to_kitchen: "Send to Kitchen",
    clear_cart: "Clear Cart",
    add_note: "Add Note",
    quantity: "Qty",
    
    // Kitchen
    new_orders: "New Orders",
    preparing: "Preparing",
    ready: "Ready",
    table_number: "Table",
    order_number: "Order #",
    start_preparing: "Start Preparing",
    mark_ready: "Ready",
    mark_delivered: "Delivered",
    elapsed_time: "Elapsed",
    
    // Orders
    order_status: "Order Status",
    pending: "Pending",
    delivered: "Delivered",
    cancelled: "Cancelled",
    paid: "Paid",
    unpaid: "Unpaid",
    order_details: "Order Details",
    order_items: "Items",
    payment_method: "Payment Method",
    cash: "Cash",
    card: "Card",
    split_payment: "Split Payment",
    
    // Products
    product_name: "Product Name",
    product_price: "Price",
    product_category: "Category",
    product_description: "Description",
    product_image: "Image URL",
    product_stock: "Stock",
    add_product: "Add Product",
    edit_product: "Edit Product",
    top_sellers: "Top Sellers",
    
    // Categories
    category_name: "Category Name",
    add_category: "Add Category",
    edit_category: "Edit Category",
    
    // Tables
    table_name: "Table Name",
    table_capacity: "Capacity",
    table_status: "Status",
    occupied: "Occupied",
    available: "Available",
    add_table: "Add Table",
    edit_table: "Edit Table",
    
    // Branches
    branch_name: "Branch Name",
    branch_address: "Address",
    branch_phone: "Phone",
    branch_tax_rate: "Tax Rate",
    add_branch: "Add Branch",
    edit_branch: "Edit Branch",
    
    // Users
    user_name: "Full Name",
    user_role: "Role",
    admin: "Admin",
    cashier: "Cashier",
    kitchen_staff: "Kitchen",
    add_user: "Add User",
    edit_user: "Edit User",
    
    // Reports
    daily_report: "Daily Report",
    weekly_report: "Weekly Report",
    monthly_report: "Monthly Report",
    total_revenue: "Total Revenue",
    total_orders: "Total Orders",
    cash_sales: "Cash Sales",
    card_sales: "Card Sales",
    staff_sales: "Staff Sales",
    
    // Settings
    business_name: "Business Name",
    business_address: "Business Address",
    business_phone: "Business Phone",
    business_email: "Business Email",
    tax_number: "Tax Number",
    default_tax_rate: "Default Tax Rate",
    currency: "Currency",
    language: "Language",
    receipt_footer: "Receipt Footer",
    
    // QR Menu
    qr_menu: "QR Menu",
    view_menu: "View Menu",
    place_order: "Place Order",
    your_order: "Your Order",
    order_sent: "Order received!",
    order_note: "Order Note",
    
    // Messages
    success: "Success",
    error: "Error",
    saved_successfully: "Saved successfully",
    deleted_successfully: "Deleted successfully",
    are_you_sure: "Are you sure?",
    operation_cannot_undone: "This action cannot be undone",
    no_data: "No data found",
    connection_error: "Connection error",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "tr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "tr" ? "en" : "tr"));
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        translations: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;
