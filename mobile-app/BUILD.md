# VOXIO Mobile App - Build Guide

## 📱 المتطلبات

### للـ Android:
- Node.js 18+
- Java JDK 17
- Android Studio + Android SDK
- Gradle 8+

### للـ iOS:
- macOS
- Xcode 15+
- CocoaPods

---

## 🚀 خطوات البناء

### 1. تثبيت الـ Dependencies

```bash
cd mobile-app
npm install
```

### 2. تثبيت الـ Pods (لـ iOS فقط)

```bash
cd ios
pod install
cd ..
```

---

## 📦 بناء Android APK

### Debug APK (للتجربة):

```bash
cd android
./gradlew assembleDebug
```

الـ APK هيكون في: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (للإنتاج):

#### أولاً: عمل Keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/voxio-release.keystore \
  -alias voxio -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD \
  -dname "CN=VOXIO, OU=VOXIO, O=VOXIO, L=Cairo, ST=Cairo, C=EG"
```

#### ثانياً: تعديل android/app/build.gradle:

```gradle
signingConfigs {
    release {
        storeFile file("voxio-release.keystore")
        storePassword "YOUR_PASSWORD"
        keyAlias "voxio"
        keyPassword "YOUR_PASSWORD"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
}
```

#### ثالثاً: بناء الـ Bundle:

```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

#### رابعاً: بناء الـ APK:

```bash
cd android
./gradlew assembleRelease
```

الـ APK هيكون في: `android/app/build/outputs/apk/release/app-release.apk`

### Android AAB (لـ Google Play):

```bash
cd android
./gradlew bundleRelease
```

الـ AAB هيكون في: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🍎 بناء iOS

### Debug (على Simulator):

```bash
npx react-native run-ios
```

### Release IPA:

```bash
cd ios
xcodebuild -workspace Voxio.xcworkspace \
  -scheme Voxio \
  -configuration Release \
  -archivePath build/Voxio.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/Voxio.xcarchive \
  -exportPath build \
  -exportOptionsPlist exportOptions.plist
```

---

## 🧪 تشغيل المشروع للتجربة

### 1. شغّل الـ Backend:

```bash
cd backend
npm install
npm start
```

الـ Backend هيشتغل على: `http://localhost:5000`

### 2. شغّل الـ Metro Bundler:

```bash
cd mobile-app
npx react-native start
```

### 3. شغّل الـ Android:

```bash
npx react-native run-android
```

### 4. شغّل الـ iOS:

```bash
npx react-native run-ios
```

---

## 📱 استخدام محاكي Android

### لو عندك Android Studio:

1. افتح Android Studio
2. افعل AVD Manager
3. اعمل Virtual Device جديد (مثلاً Pixel 6)
4. شغّل الـ Emulator
5. شغّل `npx react-native run-android`

### لو عايز تستخدم موبايل حقيقي:

1. فعّل USB Debugging على الموبايل
2. وصل الموبايل بالـ USB
3. شغّل `adb devices` عشان تتأكد إنه متعرف
4. شغّل `npx react-native run-android`

---

## 🔧 حل المشاكل الشائعة

### مشكلة: Metro bundler مش بيشتغل:

```bash
npx react-native start --reset-cache
```

### مشكلة: Gradle build فاشل:

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### مشكلة: iOS pods:

```bash
cd ios
pod deintegrate
pod install
```

### مشكلة: API مش بيتصل:

تأكد إن الـ API_BASE_URL في `src/utils/constants.js` بيشير للـ backend الصحيح:
- لو على emulator: `http://10.0.2.2:5000/api`
- لو على موبايل حقيقي: `http://YOUR_IP:5000/api`

---

## 📊 هيكل الملفات

```
mobile-app/
├── App.js                    # المكون الرئيسي
├── index.js                  # نقطة الدخول
├── package.json              # التبعيات
├── app.json                  # إعدادات التطبيق
├── babel.config.js           # إعدادات Babel
├── src/
│   ├── context/              # حالة التطبيق (Auth, Theme, Language)
│   ├── services/             # خدمات API
│   ├── navigation/           # نظام التنقل
│   ├── screens/              # الشاشات
│   │   ├── auth/             # تسجيل الدخول + إنشاء حساب
│   │   ├── dashboard/        # لوحة التحكم
│   │   ├── chat/             # المحادثات
│   │   ├── analytics/        # التحليلات
│   │   ├── orders/           # الطلبات
│   │   ├── leads/            # العملاء المحتملون
│   │   ├── products/         # المنتجات
│   │   ├── integrations/     # التكاملات
│   │   └── settings/         # الإعدادات
│   ├── components/           # المكونات المشتركة
│   │   ├── common/           # مكونات عامة (Button, Card, Input, etc.)
│   │   ├── charts/           # الرسوم البيانية
│   │   ├── chat/             # مكونات المحادثات
│   │   ├── dashboard/        # مكونات الداشبورد
│   │   └── notifications/    # مكونات الإشعارات
│   ├── hooks/                # خطافات مخصصة
│   └── utils/                # أدوات مساعدة
│       ├── colors.js         # ألوان الثيمات
│       ├── constants.js      # الثوابت
│       └── translations.js   # الترجمات (AR/EN)
├── android/                  # ملفات Android
└── ios/                      # ملفات iOS
```

---

**© 2024 VOXIO — All Rights Reserved**
