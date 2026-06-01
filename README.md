# 🧾 InvoiceHub – Quản lý hóa đơn & chi phí nhân công

Hệ thống quản lý hóa đơn đầu vào, đầu ra và chi phí nhân công, xây dựng với **Next.js 14 + MongoDB Atlas**, deploy miễn phí trên **Vercel** để nhiều user cùng truy cập.

---

## ✨ Tính năng

| Module | Chức năng |
|--------|-----------|
| 📊 Dashboard | Tổng quan doanh thu, chi phí, lợi nhuận, biểu đồ theo tháng |
| 📥 Hóa đơn đầu vào | Quản lý hóa đơn mua hàng từ nhà cung cấp |
| 📤 Hóa đơn đầu ra | Quản lý hóa đơn bán hàng cho khách hàng |
| 👥 Chi phí nhân công | Quản lý bảng lương theo tháng/bộ phận |
| 📈 Báo cáo | Biểu đồ lợi nhuận, cơ cấu chi phí |

---

## 🚀 Hướng dẫn deploy (5 bước)

### Bước 1 – Tạo MongoDB Atlas (miễn phí)

1. Truy cập https://cloud.mongodb.com → Đăng ký/đăng nhập
2. Tạo cluster mới → chọn **M0 FREE**
3. Tạo user database: **Database Access** → Add user (ghi lại username/password)
4. Cho phép truy cập từ mọi IP: **Network Access** → Add IP Address → `0.0.0.0/0`
5. **Connect** → **Drivers** → Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/invoice_db
   ```

### Bước 2 – Đưa code lên GitHub

```bash
# Trong thư mục invoice-app
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/invoice-app.git
git push -u origin main
```

### Bước 3 – Deploy lên Vercel

1. Truy cập https://vercel.com → Đăng nhập bằng GitHub
2. **New Project** → Import repo `invoice-app`
3. Framework: **Next.js** (tự động nhận diện)
4. **Environment Variables** → Thêm:
   ```
   MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/invoice_db
   ```
5. Nhấn **Deploy** → Chờ ~2 phút

### Bước 4 – Chia sẻ cho user khác

Sau khi deploy xong, Vercel cung cấp URL dạng:
```
https://invoice-app-yourname.vercel.app
```

Chia sẻ URL này cho tất cả user → họ có thể truy cập ngay trên trình duyệt, không cần cài đặt gì.

### Bước 5 – Cập nhật code

```bash
git add .
git commit -m "update"
git push
```
Vercel tự động deploy lại trong ~1 phút.

---

## 💻 Chạy local (development)

```bash
# Cài dependencies
npm install

# Tạo file .env.local
cp .env.local.example .env.local
# Điền MONGODB_URI vào file .env.local

# Chạy dev server
npm run dev
# Mở http://localhost:3000
```

---

## 🗂️ Cấu trúc dự án

```
invoice-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── invoices/       # CRUD hóa đơn
│   │   │   ├── expenses/       # CRUD chi phí nhân công
│   │   │   └── dashboard/      # Thống kê tổng hợp
│   │   ├── invoices/
│   │   │   ├── input/          # Trang hóa đơn đầu vào
│   │   │   └── output/         # Trang hóa đơn đầu ra
│   │   ├── expenses/           # Trang chi phí nhân công
│   │   ├── reports/            # Trang báo cáo
│   │   └── page.tsx            # Dashboard
│   ├── components/
│   │   ├── Sidebar.tsx         # Navigation
│   │   └── InvoiceList.tsx     # Shared invoice table
│   ├── lib/
│   │   ├── mongodb.ts          # DB connection
│   │   └── utils.ts            # Helpers
│   └── models/
│       ├── Invoice.ts          # Schema hóa đơn
│       └── Expense.ts          # Schema nhân công
├── vercel.json
└── package.json
```

---

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes (serverless)
- **Database**: MongoDB Atlas (cloud, miễn phí 512MB)
- **Deploy**: Vercel (miễn phí, không giới hạn user)

---

## 💡 Ghi chú

- **Miễn phí hoàn toàn** với MongoDB M0 (512MB) + Vercel Hobby
- **Không giới hạn user** – tất cả truy cập cùng 1 database
- Nếu cần **phân quyền user**, có thể tích hợp thêm NextAuth.js
