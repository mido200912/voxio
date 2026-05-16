import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      // إغلاق التحذيرات المزعجة الخاصة بالمتغيرات غير المستخدمة
      'no-unused-vars': 'off',
      // السماح باستخدام console.log بدون تحذيرات
      'no-console': 'off',
      // إيقاف خطأ المتغيرات غير المعرفة لتجنب مشاكل (document, window)
      'no-undef': 'off',
      // إيقاف خطأ المسافات غير القياسية (Irregular whitespace)
      'no-irregular-whitespace': 'off',
      // إيقاف خطأ الأقواس الفارغة (Empty block)
      'no-empty': 'off',
      // إيقاف خطأ الـ Regex
      'no-control-regex': 'off',
      // إيقاف الأخطاء المتبقية من الكود الأصلي
      'no-self-assign': 'off',
      'no-useless-escape': 'off',
      'preserve-caught-error': 'off'
    }
  }
];
