# ⚡ VOXIO Mobile App — PRD
## Product Requirements Document v2.0

---

## 🎨 نظام الألوان والتصميم

### الألوان الأساسية: أبيض وأسود (Black & White)

```
╔══════════════════════════════════════════════════════════════╗
║                    🌙 DARK MODE                              ║
╠══════════════════════════════════════════════════════════════╣
║  Background Primary  : #000000 (Pure Black)                  ║
║  Background Secondary: #111111 (Near Black)                  ║
║  Card Background     : #1A1A1A (Dark Card)                   ║
║  Card Elevated       : #222222 (Elevated Card)               ║
║  Text Primary        : #FFFFFF (White)                       ║
║  Text Secondary      : #A0A0A0 (Gray 400)                    ║
║  Text Muted          : #666666 (Gray 600)                    ║
║  Border             : #2A2A2A (Subtle Border)                ║
║  Divider            : #1F1F1F (Divider)                      ║
╠══════════════════════════════════════════════════════════════╣
║                    ☀️ LIGHT MODE                             ║
╠══════════════════════════════════════════════════════════════╣
║  Background Primary  : #FFFFFF (Pure White)                  ║
║  Background Secondary: #F5F5F5 (Off White)                   ║
║  Card Background     : #FFFFFF (White Card)                  ║
║  Card Elevated       : #FAFAFA (Elevated Card)               ║
║  Text Primary        : #000000 (Black)                       ║
║  Text Secondary      : #666666 (Gray 600)                    ║
║  Text Muted          : #999999 (Gray 500)                    ║
║  Border             : #E5E5E5 (Light Border)                 ║
║  Divider            : #EEEEEE (Divider)                      ║
╠══════════════════════════════════════════════════════════════╣
║                    🎨 ACCENT COLORS                          ║
╠══════════════════════════════════════════════════════════════╣
║  Success (Green)     : #22C55E                               ║
║  Warning (Amber)     : #F59E0B                               ║
║  Danger (Red)        : #EF4444                               ║
║  Info (Blue)         : #3B82F6                               ║
║  WhatsApp            : #25D366                               ║
║  Instagram           : #E4405F                               ║
║  Telegram            : #26A5E4                               ║
║  Messenger           : #1877F2                               ║
╚══════════════════════════════════════════════════════════════╝
```

### الخطوط (Typography)
```
╔══════════════════════════════════════════════════════════════╗
║  Arabic  → Cairo (Bold 700, SemiBold 600, Regular 400)      ║
║  English → Inter  (Bold 700, SemiBold 600, Regular 400)     ║
╠══════════════════════════════════════════════════════════════╣
║  Display   : 32px / Bold    → العناوين الرئيسية              ║
║  H1        : 28px / Bold    → عناوين الشاشات                 ║
║  H2        : 22px / Bold    → عناوين الأقسام                 ║
║  H3        : 18px / SemiBold → عناوين فرعية                  ║
║  Body      : 16px / Regular → النص العادي                    ║
║  Body Small: 14px / Regular → النص الصغير                    ║
║  Caption   : 12px / Regular → التسميات                       ║
║  Tiny      : 10px / Regular → النص الدقيق                    ║
╚══════════════════════════════════════════════════════════════╝
```

### المسافات (Spacing)
```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | xxl: 48px
```

### الزوايا (Border Radius)
```
sm: 8px | md: 12px | lg: 16px | xl: 24px | full: 9999px
```

---

## 🌐 نظام اللغات (Bilingual)

### العربية (RTL) والإنجليزية (LTR)
```
╔══════════════════════════════════════════════════════════════╗
║  التطبيق يدعم اللغتين العربية والإنجليزية بشكل كامل         ║
║                                                              ║
║  • العربية ← اتجاه RTL + خط Cairo                           ║
║  • الإنجليزية ← اتجاه LTR + خط Inter                        ║
║  • التبديل بين اللغات من الإعدادات                          ║
║  • كل النصوص مترجمة في ملفات منفصلة                        ║
║  • اللغة الافتراضية: العربية                                ║
║  • يتم حفظ اختيار المستخدم في التخزين المحلي                 ║
╚══════════════════════════════════════════════════════════════╝
```

### ملفات الترجمة
```
src/utils/
├── translations/
│   ├── ar.json    (العربية - 500+ مفتاح ترجمة)
│   └── en.json    (English - 500+ translation keys)
└── i18n.js        (نظام الترجمة)
```

### أمثلة الترجمة
```json
// ar.json
{
  "appName": "فوكسيو",
  "welcome": "مرحباً بك",
  "login": "تسجيل الدخول",
  "email": "البريد الإلكتروني",
  "password": "كلمة المرور",
  "dashboard": "لوحة التحكم",
  "conversations": "المحادثات",
  "analytics": "التحليلات",
  "orders": "الطلبات",
  "leads": "العملاء المحتملون",
  "products": "المنتجات",
  "integrations": "التكاملات",
  "settings": "الإعدادات",
  "notifications": "الإشعارات",
  "darkMode": "الوضع الداكن",
  "lightMode": "الوضع الفاتح",
  "language": "اللغة",
  "logout": "تسجيل الخروج",
  "newMessage": "رسالة جديدة من {name}",
  "aiReply": "تم الرد تلقائياً على {name}",
  "newOrder": "طلب جديد بقيمة {amount}",
  "humanHandoff": "{name} يطلب التحدث مع موظف",
  "muteNotifications": "كتم الإشعارات",
  "unmuteNotifications": "تفعيل الإشعارات",
  "noData": "لا توجد بيانات",
  "loading": "جاري التحميل...",
  "retry": "إعادة المحاولة",
  "save": "حفظ",
  "cancel": "إلغاء",
  "delete": "حذف",
  "edit": "تعديل",
  "search": "بحث...",
  "all": "الكل",
  "active": "نشط",
  "inactive": "غير نشط"
}

// en.json
{
  "appName": "VOXIO",
  "welcome": "Welcome",
  "login": "Login",
  "email": "Email",
  "password": "Password",
  "dashboard": "Dashboard",
  "conversations": "Conversations",
  "analytics": "Analytics",
  "orders": "Orders",
  "leads": "Leads",
  "products": "Products",
  "integrations": "Integrations",
  "settings": "Settings",
  "notifications": "Notifications",
  "darkMode": "Dark Mode",
  "lightMode": "Light Mode",
  "language": "Language",
  "logout": "Logout",
  "newMessage": "New message from {name}",
  "aiReply": "Auto-replied to {name}",
  "newOrder": "New order worth {amount}",
  "humanHandoff": "{name} requests human support",
  "muteNotifications": "Mute Notifications",
  "unmuteNotifications": "Unmute Notifications",
  "noData": "No data available",
  "loading": "Loading...",
  "retry": "Retry",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "search": "Search...",
  "all": "All",
  "active": "Active",
  "inactive": "Inactive"
}
```

---

## 📱 هيكل المشروع الكامل

```
mobile-app/
├── PRD.md                          # هذا الملف
├── package.json                    # التبعيات
├── app.json                        # إعدادات التطبيق
├── babel.config.js                 # إعدادات Babel
├── index.js                        # نقطة الدخول
├── App.js                          # المكون الرئيسي
│
├── src/
│   │
│   ├── 🧭 navigation/
│   │   ├── AppNavigator.js         # الملاحة الرئيسية (Auth vs Main)
│   │   ├── AuthNavigator.js        # ملاحة تسجيل الدخول
│   │   ├── MainNavigator.js        # ملاحة التطبيق الرئيسية
│   │   └── BottomTabNavigator.js   # التابات السفلية
│   │
│   ├── 📺 screens/
│   │   │
│   │   ├── 🔐 auth/
│   │   │   ├── LoginScreen.js              # تسجيل الدخول
│   │   │   ├── RegisterScreen.js           # حساب جديد
│   │   │   ├── ForgotPasswordScreen.js     # نسيت كلمة المرور
│   │   │   └── OtpScreen.js                # رمز التحقق
│   │   │
│   │   ├── 📊 dashboard/
│   │   │   ├── DashboardHomeScreen.js      # الصفحة الرئيسية
│   │   │   └── DashboardStatsScreen.js     # إحصائيات تفصيلية
│   │   │
│   │   ├── 💬 chat/
│   │   │   ├── ConversationsScreen.js      # قائمة المحادثات
│   │   │   └── ChatDetailScreen.js         # محادثة تفصيلية
│   │   │
│   │   ├── 📈 analytics/
│   │   │   └── AnalyticsScreen.js          # التحليلات الكاملة
│   │   │
│   │   ├── 🛒 orders/
│   │   │   └── OrdersScreen.js             # الطلبات
│   │   │
│   │   ├── 👥 leads/
│   │   │   └── LeadsScreen.js              # العملاء المحتملون
│   │   │
│   │   ├── 📦 products/
│   │   │   └── ProductsScreen.js           # المنتجات
│   │   │
│   │   ├── 🔗 integrations/
│   │   │   └── IntegrationsScreen.js       # التكاملات
│   │   │
│   │   ├── ⚙️ settings/
│   │   │   ├── SettingsScreen.js           # الإعدادات الرئيسية
│   │   │   ├── NotificationSettingsScreen.js  # إعدادات الإشعارات
│   │   │   ├── CompanySettingsScreen.js    # بيانات الشركة
│   │   │   ├── AiSettingsScreen.js         # إعدادات الذكاء الاصطناعي
│   │   │   └── AppearanceScreen.js         # المظهر (ثيم + لغة)
│   │   │
│   │   └── 🚀 onboarding/
│   │       ├── ProfileScreen.js            # الملف الشخصي
│   │       ├── KnowledgeScreen.js          # قاعدة المعرفة
│   │       └── ConnectScreen.js            # ربط التكاملات
│   │
│   ├── 🔌 services/
│   │   ├── api.js                  # Axios instance + interceptors
│   │   ├── authService.js          # خدمات المصادقة
│   │   ├── chatService.js          # خدمات المحادثات
│   │   ├── analyticsService.js     # خدمات التحليلات
│   │   ├── companyService.js       # خدمات الشركة
│   │   ├── orderService.js         # خدمات الطلبات
│   │   ├── leadService.js          # خدمات العملاء
│   │   ├── productService.js       # خدمات المنتجات
│   │   ├── integrationService.js   # خدمات التكاملات
│   │   └── notificationService.js  # خدمات الإشعارات
│   │
│   ├── 🎣 context/
│   │   ├── AuthContext.js          # حالة المصادقة
│   │   ├── ThemeContext.js         # حالة الثيم (Dark/Light)
│   │   ├── LanguageContext.js      # حالة اللغة (AR/EN)
│   │   └── NotificationContext.js  # حالة الإشعارات
│   │
│   ├── 🧩 components/
│   │   │
│   │   ├── common/
│   │   │   ├── VButton.js                  # زر مخصص
│   │   │   ├── VCard.js                    # كارد مخصص
│   │   │   ├── VInput.js                   # حقل إدخال
│   │   │   ├── VHeader.js                  # هيدر الشاشة
│   │   │   ├── VLoading.js                 # تحميل
│   │   │   ├── VEmptyState.js              # حالة فارغة
│   │   │   ├── VErrorState.js              # حالة خطأ
│   │   │   ├── VBadge.js                   # شارة
│   │   │   ├── VAvatar.js                  # صورة شخصية
│   │   │   ├── VSwitch.js                  # مفتاح تبديل
│   │   │   ├── VModal.js                   # نافذة منبثقة
│   │   │   ├── VToast.js                   # إشعار سريع
│   │   │   └── VTabBar.js                  # شريط تبويب
│   │   │
│   │   ├── charts/
│   │   │   ├── VLineChart.js               # رسم بياني خطي
│   │   │   ├── VBarChart.js                # رسم بياني أعمدة
│   │   │   ├── VPieChart.js                # رسم بياني دائري
│   │   │   └── VHeatmap.js                 # خريطة حرارية
│   │   │
│   │   ├── chat/
│   │   │   ├── MessageBubble.js            # فقاعة رسالة
│   │   │   ├── ConversationItem.js         # عنصر محادثة
│   │   │   ├── ChatInput.js                # إدخال الرسالة
│   │   │   └── PlatformBadge.js            # شارة المنصة
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.js                 # كارد إحصائية
│   │   │   ├── QuickActions.js             # إجراءات سريعة
│   │   │   ├── RecentActivity.js           # النشاط الأخير
│   │   │   └── AiInsightCard.js            # بطاقة رؤية AI
│   │   │
│   │   └── notifications/
│   │       ├── NotificationItem.js         # عنصر إشعار
│   │       ├── NotificationList.js         # قائمة الإشعارات
│   │       ├── MuteButton.js               # زر الكتم
│   │       └── NotificationToggle.js       # تبديل نوع الإشعار
│   │
│   ├── 🛠️ utils/
│   │   ├── constants.js            # الثوابت
│   │   ├── helpers.js              # دوال مساعدة
│   │   ├── secureStorage.js        # تخزين آمن
│   │   ├── i18n.js                 # نظام الترجمة
│   │   ├── colors.js               # ألوان الثيمات
│   │   ├── validation.js           # التحقق من البيانات
│   │   └── formatters.js           # تنسيق الأرقام والتواريخ
│   │
│   └── 🪝 hooks/
│       ├── useAuth.js              # خطاف المصادقة
│       ├── useTheme.js             # خطاف الثيم
│       ├── useLanguage.js          # خطاف اللغة
│       ├── useNotifications.js     # خطاف الإشعارات
│       ├── useAnalytics.js         # خطاف التحليلات
│       └── useConversations.js     # خطاف المحادثات
│
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/voxio/
│   │       │   ├── MainActivity.java
│   │       │   └── MainApplication.java
│   │       └── res/
│   │           ├── values/strings.xml
│   │           ├── values/styles.xml
│   │           ├── drawable/
│   │           └── mipmap-xxxhdpi/ic_launcher.png
│   ├── build.gradle
│   └── settings.gradle
│
└── ios/
    ├── Voxio/
    │   ├── Info.plist
    │   ├── AppDelegate.mm
    │   ├── main.m
    │   └── Images.xcassets/
    ├── Podfile
    └── Voxio.xcodeproj/
```

---

## 📋 تفاصيل كل شاشة

### ═══════════════════════════════════════
### 🔐 شاشة تسجيل الدخول (LoginScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│                                 │
│         ⚡ VOXIO                │
│    ─────────────────            │
│    مرحباً بك مجدداً             │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📧 البريد الإلكتروني    │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 🔒 كلمة المرور          │    │
│  └─────────────────────────┘    │
│                                 │
│  ☑ تذكرني    نسيت كلمة المرور؟ │
│                                 │
│  ┌─────────────────────────┐    │
│  │     🔑 تسجيل الدخول     │    │
│  └─────────────────────────┘    │
│                                 │
│  ─────── أو ───────             │
│                                 │
│  ┌─────────────────────────┐    │
│  │  🔵 الدخول بجوجل        │    │
│  └─────────────────────────┘    │
│                                 │
│  ليس لديك حساب؟ سجل الآن        │
│                                 │
│  🌙 Dark Mode    🌐 العربية     │
│                                 │
└─────────────────────────────────┘
```

**الفيتشرز:**
- إدخال Email + Password
- زر Login مع Loading
- Google Login
- تذكرني (Remember Me)
- نسيت كلمة المرور
- تبديل Dark/Light Mode
- تبديل اللغة AR/EN
- Validation كاملة
- رسائل خطأ واضحة
- أنيميشن سلسة

---

### ═══════════════════════════════════════
### 📊 شاشة الداشبورد (DashboardHomeScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ ⚡ VOXIO          🔔 👤 🌙     │
│ ─────────────────────────────── │
│ مرحباً، أحمد 👋                  │
│ ─────────────────────────────── │
│                                 │
│ ┌──────────┐ ┌──────────┐      │
│ │ 💬 1,234 │ │ 🤖 87%   │      │
│ │ محادثة   │ │ حل AI   │      │
│ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐      │
│ │ 👥 56    │ │ ⚡ 2.3s  │      │
│ │ نشط الآن │ │ استجابة │      │
│ └──────────┘ └──────────┘      │
│                                 │
│ 📈 نشاط المحادثات (7 أيام)      │
│ ┌─────────────────────────┐    │
│ │    ╱╲    ╱╲             │    │
│ │   ╱  ╲  ╱  ╲   ╱╲      │    │
│ │  ╱    ╲╱    ╲ ╱  ╲     │    │
│ │ ╱            ╲    ╲    │    │
│ └─────────────────────────┘    │
│                                 │
│ 📊 توزيع المنصات                │
│ ┌─────────────────────────┐    │
│ │    ╭───────╮            │    │
│ │   │  40%   │ 💬 WhatsApp│    │
│ │   │  30%   │ 📸 Insta  │    │
│ │   │  20%   │ ✈️ Tele   │    │
│ │   │  10%   │ 🌐 Web   │    │
│ │    ╰───────╯            │    │
│ └─────────────────────────┘    │
│                                 │
│ ⚡ رؤية AI                      │
│ ┌─────────────────────────┐    │
│ │ 💡 نشاطك زاد 30% عن     │    │
│ │    الأسبوع الماضي!      │    │
│ └─────────────────────────┘    │
│                                 │
│ 🔥 ساعات الذروة                 │
│ ┌─────────────────────────┐    │
│ │ ██░░██░░░███░░██░░░██░  │    │
│ │ 12AM  6AM  12PM  6PM    │    │
│ └─────────────────────────┘    │
│                                 │
│ ⚡ إجراءات سريعة                │
│ ┌──────┐┌──────┐┌──────┐      │
│ │ 💬   ││ 📊   ││ 🛒   │      │
│ │ شات  ││ تحليل││ طلبات│      │
│ └──────┘└──────┘└──────┘      │
│                                 │
│ ─────────────────────────────── │
│  📊    💬    🛒    ⚙️          │
│ داشبورد شات  طلبات إعدادات    │
└─────────────────────────────────┘
```

**الفيتشرز:**
- 4 كارد إحصائية (محادثات، AI Rate، نشط، وقت الاستجابة)
- Line Chart للنشاط
- Donut Chart لتوزيع المنصات
- Heatmap لساعات الذروة
- AI Insight Card
- Quick Actions (شات، تحليلات، طلبات، إعدادات)
- Pull to Refresh
- Bottom Tab Navigation
- إشعارات Badge

---

### ═══════════════════════════════════════
### 💬 شاشة المحادثات (ConversationsScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ 💬 المحادثات          🔍 ⚙️    │
│ ─────────────────────────────── │
│                                 │
│ ┌──────┐┌──────┐┌─────┐┌─────┐ │
│ │ الكل ││تحويل ││تلقائي││يدوي│ │
│ │  24  ││  🔴3 ││ 18  ││  3  │ │
│ └──────┘└──────┘└─────┘└─────┘ │
│                                 │
│ ┌─────────────────────────┐    │
│ │ 💬 أحمد محمد              │    │
│ │ 📱 WhatsApp  • منذ 5 د   │    │
│ │ "أريد معرفة الأسعار..."  │    │
│ │ 🤖 AI ON  │ 12 رسالة     │    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ 📸 سارة علي               │    │
│ │ 📸 Instagram • منذ 15 د  │    │
│ │ "هل يوجد توصيل؟"         │    │
│ │ 🔴 HANDOFF│ 8 رسالة      │    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ ✈️ محمد خالد              │    │
│ │ ✈️ Telegram • منذ 1 ساعة │    │
│ │ "متى يفتح المتجر؟"       │    │
│ │ 🤖 AI ON  │ 5 رسالة      │    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ 🌐 زائر #4521            │    │
│ │ 🌐 Website • منذ 2 ساعة │    │
│ │ "أحتاج مساعدة في..."     │    │
│ │ ⏸️ AI OFF │ 3 رسالة      │    │
│ └─────────────────────────┘    │
│                                 │
│ ─────────────────────────────── │
│  📊    💬    🛒    ⚙️          │
└─────────────────────────────────┘
```

---

### ═══════════════════════════════════════
### 💬 شاشة تفاصيل المحادثة (ChatDetailScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ ← 💬 أحمد محمد         ⋮ ⚙️   │
│ 📱 WhatsApp • 12 رسالة         │
│ ─────────────────────────────── │
│                                 │
│         ┌──────────────┐        │
│         │ مرحباً، أريد │        │
│         │ معرفة الأسعار│        │
│         └──────────────┘        │
│ 10:30 صباحاً                    │
│                                 │
│ ┌──────────────┐                │
│ │ أهلاً أحمد!  │                │
│ │ تفضل الأسعار │                │
│ │ هي...        │                │
│ └──────────────┘                │
│                    10:31 صباحاً │
│ 🤖 AI                           │
│                                 │
│         ┌──────────────┐        │
│         │ شكراً! هل   │        │
│         │ يوجد توصيل؟  │        │
│         └──────────────┘        │
│ 10:35 صباحاً                    │
│                                 │
│ ┌──────────────┐                │
│ │ نعم، نوفر    │                │
│ │ توصيل مجاني  │                │
│ │ للطلبات فوق  │                │
│ │ 200 ريال     │                │
│ └──────────────┘                │
│                    10:36 صباحاً │
│ 👨‍💼 Agent                        │
│                                 │
│ ─────────────────────────────── │
│ ┌─────────────────────────┐ 📤 │
│ │ اكتب ردك هنا...         │    │
│ └─────────────────────────┘    │
│                                 │
│ 🤖 AI: ON  ⏸️ إيقاف  ▶️ تفعيل  │
└─────────────────────────────────┘
```

**الفيتشرز:**
- عرض الرسائل بفقاعات (User/AI/Agent)
- إدخال الرد مع زر إرسال
- Toggle AI On/Off
- Accept Handoff
- عرض وقت كل رسالة
- عرض نوع المرسل (👤/🤖/👨‍💼)
- سكرول تلقائي لآخر رسالة
- إرسال بزر أو Enter

---

### ═══════════════════════════════════════
### 📈 شاشة التحليلات (AnalyticsScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ 📈 التحليلات         📥 🔄    │
│ ─────────────────────────────── │
│                                 │
│ ┌──────┐┌──────┐┌──────┐      │
│ │ 7 أيام││ 30 يوم││ 90 يوم│      │
│ └──────┘└──────┘└──────┘      │
│                                 │
│ ┌──────────┐ ┌──────────┐      │
│ │ 💬 5,432 │ │ 🤖 87%   │      │
│ │ رسالة    │ │ حل AI   │      │
│ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐      │
│ │ 👥 234   │ │ ⚡ 2.3s  │      │
│ │ عميل     │ │ استجابة │      │
│ └──────────┘ └──────────┘      │
│                                 │
│ 📈 نشاط الرسائل                │
│ ┌─────────────────────────┐    │
│ │  ╱╲    ╱╲               │    │
│ │ ╱  ╲  ╱  ╲   ╱╲        │    │
│ │╱    ╲╱    ╲ ╱  ╲  ╱╲   │    │
│ │              ╲╱    ╲╱   │    │
│ │ 👤 مستخدمين  🤖 AI     │    │
│ └─────────────────────────┘    │
│                                 │
│ 📊 حجم المحادثات                │
│ ┌─────────────────────────┐    │
│ │ ██                      │    │
│ │ ██ ██                   │    │
│ │ ██ ██ ██                │    │
│ │ ██ ██ ██ ██             │    │
│ └─────────────────────────┘    │
│                                 │
│ 🍩 توزيع المنصات                │
│ ┌─────────────────────────┐    │
│ │    ╭──────╮             │    │
│   │  ●   │ 💬 WhatsApp│    │
│ │   │      │ 📸 Insta  │    │
│ │   │      │ ✈️ Tele   │    │
│ │   │      │ 🌐 Web   │    │
│ │    ╰──────╯             │    │
│ └─────────────────────────┘    │
│                                 │
│ 🔥 ساعات الذروة                 │
│ ┌─────────────────────────┐    │
│ │ ██░░██░░░███░░██░░░██░  │    │
│ │ ذروة: 2PM - 45 رسالة     │    │
│ └─────────────────────────┘    │
│                                 │
│ ⚡ أداء الـ AI                  │
│ ┌─────────────────────────┐    │
│ │ متوسط: 2.3s │ أسرع: 0.5s│    │
│ │ AI: 75% │ بشري: 25%     │    │
│ │ ● 12 مستخدم نشط          │    │
│ └─────────────────────────┘    │
│                                 │
│ 👥 العملاء المحتملون            │
│ ┌─────────────────────────┐    │
│ │ جدد: 45 │ تم التواصل: 30│    │
│ │ محولون: 15 │ ضائعون: 5  │    │
│ └─────────────────────────┘    │
│                                 │
│ ─────────────────────────────── │
│  📊    💬    🛒    ⚙️          │
└─────────────────────────────────┘
```

**الفيتشرز:**
- KPI Cards (رسائل، AI Rate، عملاء، وقت الاستجابة)
- Period Selector (7d, 30d, 90d)
- Line Chart (نشاط الرسائل)
- Bar Chart (حجم المحادثات)
- Donut Chart (توزيع المنصات)
- Heatmap (ساعات الذروة)
- AI Performance Stats
- Leads Overview
- Pull to Refresh
- Download PDF

---

### ═══════════════════════════════════════
### 🛒 شاشة الطلبات (OrdersScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ 🛒 الطلبات            🔍 +     │
│ ─────────────────────────────── │
│                                 │
│ ┌──────┐┌──────┐┌──────┐      │
│ │ الكل ││جديد  ││مكتمل │      │
│ │  45  ││  12  ││  33  │      │
│ └──────┘└──────┘└──────┘      │
│                                 │
│ ┌─────────────────────────┐    │
│ │ #1234 أحمد محمد           │    │
│ │ 📱 WhatsApp • 2 منتجات   │    │
│ │ 💰 450 ريال • ✅ مكتمل   │    │
│ │ 📅 منذ ساعة              │    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ #1235 سارة علي            │    │
│ │ 📸 Instagram • 1 منتج   │    │
│ │ 💰 120 ريال • 🟡 جديد   │    │
│ │ 📅 منذ 3 ساعات          │    │
│ └─────────────────────────┘    │
│                                 │
│ ─────────────────────────────── │
│  📊    💬    🛒    ⚙️          │
└─────────────────────────────────┘
```

---

### ═══════════════════════════════════════
### ⚙️ شاشة الإعدادات (SettingsScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ ⚙️ الإعدادات                    │
│ ─────────────────────────────── │
│                                 │
│ 👤 الملف الشخصي                 │
│ ┌─────────────────────────┐    │
│ │ 🏢 بيانات الشركة         │ >  │
│ │ 🤖 إعدادات الذكاء       │ >  │
│ │ 🔗 مفاتيح API           │ >  │
│ └─────────────────────────┘    │
│                                 │
│ 🔔 الإشعارات                    │
│ ┌─────────────────────────┐    │
│ │ 🔔 إعدادات الإشعارات    │ >  │
│ │ 🔇 كتم الإشعارات        │    │
│ └─────────────────────────┘    │
│                                 │
│ 🎨 المظهر                       │
│ ┌─────────────────────────┐    │
│ │ 🌙 الوضع الداكن    [ON] │    │
│ │ 🌐 اللغة: العربية   [AR]│    │
│ └─────────────────────────┘    │
│                                 │
│ ┌─────────────────────────┐    │
│ │ 🔑 تغيير كلمة المرور    │ >  │
│ │ 🚪 تسجيل الخروج         │    │
│ └─────────────────────────┘    │
│                                 │
│ ─────────────────────────────── │
│  📊    💬    🛒    ⚙️          │
└─────────────────────────────────┘
```

---

### ═══════════════════════════════════════
### 🔔 شاشة إعدادات الإشعارات (NotificationSettingsScreen)
### ═══════════════════════════════════════

```
┌─────────────────────────────────┐
│ ← 🔔 إعدادات الإشعارات         │
│ ─────────────────────────────── │
│                                 │
│ 🔔 تفعيل الإشعارات              │
│ ┌─────────────────────────┐    │
│ │ 🔔 كل الإشعارات   [ON] │    │
│ └─────────────────────────┘    │
│                                 │
│ 📋 أنواع الإشعارات              │
│ ┌─────────────────────────┐    │
│ │ 💬 رسالة جديدة     [ON] │    │
│ │ 🤖 رد AI تلقائي   [ON] │    │
│ │ 🛒 طلب جديد        [ON] │    │
│ │ 👤 تحويل بشري     [ON] │    │
│ │ 📊 تقرير يومي     [OFF]│    │
│ └─────────────────────────┘    │
│                                 │
│ 📱 كتم حسب المنصة               │
│ ┌─────────────────────────┐    │
│ │ 💬 WhatsApp        [ON] │    │
│ │ 📸 Instagram       [ON] │    │
│ │ ✈️ Telegram        [ON] │    │
│ │ 🌐 Website         [OFF]│    │
│ └─────────────────────────┘    │
│                                 │
│ 🔇 كتم مؤقت (Do Not Disturb)    │
│ ┌─────────────────────────┐    │
│ │ ⏰ من: 10:00 مساءً      │    │
│ │ ⏰ إلى: 7:00 صباحاً     │    │
│ │ 🔇 تفعيل الكتم     [OFF]│    │
│ └─────────────────────────┘    │
│                                 │
│ 🔊 الصوت والاهتزاز              │
│ ┌─────────────────────────┐    │
│ │ 🔊 صوت الإشعار     [ON] │    │
│ │ 📳 الاهتزاز        [ON] │    │
│ └─────────────────────────┘    │
│                                 │
│ ┌─────────────────────────┐    │
│ │ 🧪 إرسال إشعار تجريبي   │    │
│ └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | تسجيل الدخول |
| /api/auth/register | POST | تسجيل حساب |
| /api/auth/google-login | POST | دخول بجوجل |
| /api/auth/refresh | POST | تجديد التوكن |
| /api/auth/logout | POST | تسجيل خروج |
| /api/auth/forgot-password | POST | نسيت كلمة المرور |
| /api/auth/change-password | POST | تغيير كلمة المرور |
| /api/company | GET/PUT | بيانات الشركة |
| /api/company/analytics | GET | التحليلات |
| /api/company/apikey | GET | مفتاح API |
| /api/analytics/dashboard | GET | لوحة التحليلات |
| /api/analytics/timeseries | GET | بيانات زمنية |
| /api/analytics/platforms | GET | توزيع المنصات |
| /api/analytics/hourly | GET | ساعات الذروة |
| /api/analytics/leads | GET | العملاء المحتملين |
| /api/handoff/conversations | GET | المحادثات |
| /api/handoff/conversation/:id | GET | محادثة محددة |
| /api/handoff/reply | POST | رد على محادثة |
| /api/handoff/toggle-ai | POST | تفعيل/تعطيل AI |
| /api/handoff/accept | POST | قبول تحويل بشري |
| /api/orders | GET | الطلبات |
| /api/products | GET/POST | المنتجات |
| /api/leads | GET/POST | العملاء المحتملين |
| /api/notifications/fcm-token | POST/DELETE | حفظ/حذف FCM Token |
| /api/notifications/test | POST | إشعار تجريبي |
| /api/notifications/settings | GET/PUT | إعدادات الإشعارات |
| /api/notifications/mute | POST | كتم الإشعارات |
| /api/integrations | GET | حالة التكاملات |
| /api/chatbot-editor | GET/POST | إعدادات الشات بوت |
| /api/team | GET/POST | إدارة الفريق |
| /api/broadcast | POST | بث رسالة |

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-firebase/app": "^18.7.3",
    "@react-native-firebase/messaging": "^18.7.3",
    "react-native-push-notification": "^8.1.1",
    "axios": "^1.6.2",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "^14.1.0",
    "react-native-vector-icons": "^10.0.3",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.1",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-screens": "^3.29.0",
    "react-native-image-picker": "^7.1.0",
    "react-native-document-picker": "^9.1.0",
    "react-native-share": "^10.0.2",
    "react-native-linear-gradient": "^2.8.3",
    "lottie-react-native": "^6.5.1",
    "react-native-splash-screen": "^3.3.0",
    "react-native-encrypted-storage": "^4.0.3",
    "react-native-restart": "^0.0.27"
  }
}
```

---

## 🔄 User Flow

```
1. فتح التطبيق
   └── Splash Screen (2 ثانية)
       ├── لو مسجل دخول → Dashboard
       └── لو مش مسجيل → Login

2. Login
   ├── إدخال Email/Password → Dashboard
   ├── Google Login → Dashboard
   └── Forgot Password → Reset Password → Login

3. Dashboard
   ├── Stats + Charts
   ├── Quick Actions
   └── Bottom Tabs

4. Conversations
   ├── اختيار محادثة → Chat Detail
   ├── الرد على العميل
   └── Toggle AI

5. Analytics
   ├── عرض التحليلات
   ├── تغيير الفترة
   └── تحميل PDF

6. Settings
   ├── تعديل البيانات
   ├── إعدادات الإشعارات
   ├── تغيير اللغة/الثيم
   └── تسجيل الخروج
```

---

## 🚀 Build Commands

```bash
# Android APK
cd android && ./gradlew assembleRelease

# Android AAB (Google Play)
cd android && ./gradlew bundleRelease

# iOS
cd ios && pod install
xcodebuild -workspace Voxio.xcworkspace -scheme Voxio -configuration Release
```

---

## 📱 Platform Support
- **Android**: APK + AAB (minSdk 21, targetSdk 34)
- **iOS**: iOS 13.0+
- **Orientations**: Portrait only
- **Languages**: Arabic (RTL) + English (LTR)
- **Themes**: Dark Mode + Light Mode

---

**© 2026 VOXIO — All Rights Reserved**
**Document Version: 2.0 | Last Updated: 2026**