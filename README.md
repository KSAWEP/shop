
# Moon Store — Netlify

## 1) المتطلبات
- Node.js LTS
- حساب Netlify

## 2) التشغيل محليًا
```bash
npm install
npx netlify login
# عرّف مفاتيح Paylink (استبدل القيم بقيمك الحقيقية)
npx netlify env:set PAYLINK_APP_ID APP_ID_XXXXXXXXXXXX
npx netlify env:set PAYLINK_SECRET_KEY fbb3d2d5-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# شغّل البيئة المحلية
npm run dev
```

يفتح على: http://localhost:8888

## 3) النشر
```bash
npx netlify init   # اربط المجلد بموقع جديد أو قائم
npx netlify deploy --prod
```

## 4) ربط الدومين
من لوحة Netlify > Site settings > Domain management > Add custom domain
وأضف سجلات DNS من مزود الدومين إلى Netlify.

## 5) Webhook (اختياري)
ضع رابط الويبهوك التالي في لوحة Paylink لحدث الدفع:
```
https://YOUR-SITE.netlify.app/api/payment-webhook
```
