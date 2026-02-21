# Lumina POS - Restoran Otomasyon Sistemi PRD

## Problem Statement
Kafe ve restoranlar için kullanılacak, kurumsal seviyede, ölçeklenebilir, web tabanlı bir POS & Restoran Otomasyon Sistemi.

## User Personas
1. **Admin (Yönetici)**: Tüm sisteme erişim, şube/ürün/kullanıcı yönetimi, raporlama
2. **Kasiyer**: POS ekranı, sipariş alma, ödeme işleme
3. **Mutfak Personeli**: Mutfak ekranı (KDS), sipariş durumu güncelleme
4. **Müşteri**: QR menü üzerinden sipariş verme

## Core Requirements (Static)
- Güvenli JWT tabanlı kimlik doğrulama
- Rol bazlı yetkilendirme (Admin, Kasiyer, Mutfak)
- Çok şubeli yapı desteği
- Ürün ve kategori yönetimi
- Dokunmatik uyumlu POS ekranı
- Masa bazlı sipariş yönetimi
- Gerçek zamanlı mutfak ekranı (WebSocket)
- Nakit/Kart ödeme işleme
- QR menü ve müşteri sipariş sistemi
- Çoklu dil desteği (TR/EN)
- Raporlama dashboard

## What's Been Implemented ✅
**Date: 2026-02-21**

### Backend (FastAPI + MongoDB)
- ✅ JWT Authentication with role-based access
- ✅ CRUD for: Users, Branches, Categories, Products, Tables, Orders
- ✅ WebSocket for real-time kitchen notifications
- ✅ Payment processing (cash/card)
- ✅ Reports API (daily/weekly/monthly, staff sales, top sellers)
- ✅ Settings API
- ✅ QR Menu public endpoints
- ✅ Demo data initialization

### Frontend (React + TailwindCSS + Shadcn)
- ✅ Login page with role-based routing
- ✅ Admin Dashboard with stats and quick actions
- ✅ POS Screen (touch-friendly, category tabs, cart, order types)
- ✅ Kitchen Display (KDS) with status columns
- ✅ Orders management page
- ✅ Products management (CRUD)
- ✅ Categories management (CRUD)
- ✅ Tables management (CRUD)
- ✅ Branches management (CRUD)
- ✅ Users management (CRUD)
- ✅ Reports page with charts
- ✅ Settings page
- ✅ QR Menu page (public, mobile-friendly)
- ✅ Multi-language support (TR/EN)
- ✅ Dark theme

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Authentication & Authorization
- [x] POS Core Flow
- [x] Kitchen Display
- [x] Basic Reporting

### P1 - High Priority
- [ ] Termal yazıcı entegrasyonu (80mm fiş)
- [ ] Bölünmüş ödeme desteği
- [ ] Stok takibi alerts
- [ ] e-Arşiv/e-Fatura hazırlığı

### P2 - Medium Priority
- [ ] QR kod generator (masa bazlı)
- [ ] Sesli bildirimler (mutfak)
- [ ] Offline mode desteği
- [ ] Müşteri sadakat programı

### P3 - Nice to Have
- [ ] Sipariş geçmişi (müşteri)
- [ ] Kurye takibi
- [ ] Envanter yönetimi
- [ ] WhatsApp entegrasyonu

## Tech Stack
- Backend: FastAPI, MongoDB, WebSocket
- Frontend: React 19, TailwindCSS, Shadcn/UI, Recharts
- Auth: JWT
- Real-time: WebSocket

## Demo Credentials
- Admin: admin@lumina.com / admin123
- Kasiyer: kasiyer@lumina.com / kasiyer123
- Mutfak: mutfak@lumina.com / mutfak123

## Next Tasks
1. Termal yazıcı entegrasyonu
2. Bölünmüş ödeme implementasyonu
3. QR kod generator
4. Stok alert sistemi
