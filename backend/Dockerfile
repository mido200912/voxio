# استخدم Node.js الرسمي
FROM node:18

# تحديد مكان العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات المشروع
COPY package*.json ./

# تثبيت التبعيات (Control 12: Dependency Integrity)
RUN npm ci

# نسخ باقي الملفات
COPY . .

# تحديد البورت اللي هيتشغل عليه السيرفر
EXPOSE 5000

# Control 15: Container Isolation (Drop Root)
USER node

# أمر التشغيل (Control 23: Memory Safety Boundary)
CMD ["node", "--max-old-space-size=1536", "server.js"]
