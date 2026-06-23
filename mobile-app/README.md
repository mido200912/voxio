# ⚡ VOXIO Mobile App

## تطبيق VOXIO للموبيل — React Native

تطبيق كامل لإدارة منصة AI Chat Bots للشركات. بيوفر كل فيتشرز الويب سايت في الموبايل مع نظام Push Notifications قوي.

---

## 🎨 التصميم

- **الألوان الأساسية**: أبيض وأسود (Black & White)
- **Dark Mode** 🌙 + **Light Mode** ☀️
- **دعم اللغات**: العربية (RTL) + الإنجليزية (LTR)

---

## 📱 الشاشات

| الشاشة | الوصف |
|--------|-------|
| 🔐 Login | تسجيل الدخول + Google Login |
| 📝 Register | إنشاء حساب جديد |
| 🔑 Forgot Password | نسيت كلمة المرور |
| 📊 Dashboard | إحصائيات + Charts + Quick Actions |
| 💬 Conversations | قائمة المحادثات (All/Handoff/Auto/Manual) |
| 💬 Chat Detail | محادثة تفصيلية + رد + Toggle AI |
| 📈 Analytics | تحليلات كاملة + KPI + Charts |
| 🛒 Orders | الطلبات + فلترة |
| 👥 Leads | العملاء المحتملون |
| 📦 Products | المنتجات |
| 🔗 Integrations | WhatsApp, Instagram, Telegram, Shopify |
| ⚙️ Settings | الإعدادات الرئيسية |
| 🔔 Notification Settings | إعدادات الإشعارات + Mute |
| 🤖 AI Settings | إعدادات الذكاء الاصطناعي |
| 🏢 Company Settings | بيانات الشركة |
| 🎨 Appearance | الثيم + اللغة |

---

## 🔔 نظام الإشعارات

- 💬 رسالة جديدة من عميل
- 🤖 رد AI تلقائي
- 🛒 طلب جديد
- 👤 تحويل بشري مطلوب
- 📊 تقرير يومي
- **Mute/Unmute** لكل نوع إشعار
- **Mute** لكل منصة
- **Do Not Disturb** mode

---

## 🚀 التشغيل

### 1. شغّل الـ Backend:
```bash
cd backend
npm install
npm start
```

### 2. شغّل الـ Mobile App:
```bash
cd mobile-app
npm install
npx react-native start
```

### 3. شغّل على Android:
```bash
npx react-native run-android
```

### 4. شغّل على iOS:
```bash
npx react-native run-ios
```

---

## 📦 بناء APK

```bash
./build-apk.sh
```

أو يدوياً:
```bash
cd android
./gradlew assembleRelease
```

الـ APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🍎 بناء iOS

```bash
./build-ios.sh
```

---

## 📊 هيكل الملفات

```
mobile-app/
├── App.js                    # المكون الرئيسي
├── index.js                  # نقطة الدخول
├── src/
│   ├── context/              # Auth, Theme, Language
│   ├── services/             # API services
│   ├── navigation/           # App, Auth, Main, BottomTab
│   ├── screens/              # 15+ شاشة
│   ├── components/           # مكونات مشتركة
│   ├── hooks/                # useAuth, useTheme, etc.
│   └── utils/                # colors, constants, translations
├── android/                  # ملفات Android
└── ios/                      # ملفات iOS
```

---

**© 2024 VOXIO — All Rights Reserved**
