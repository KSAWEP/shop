const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // السماح بـ OPTIONS للتحقق من CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { productName, amount, customerInfo } = JSON.parse(event.body);
    
if (!PAYLINK_APP_ID || !PAYLINK_SECRET_KEY) {
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ success: false, error: 'مفاتيح الدفع غير معرفة على Netlify: PAYLINK_APP_ID و PAYLINK_SECRET_KEY' })
  };
}

    
    // إنشاء رقم فاتورة MOON مخصص
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const invoiceNumber = `MOON-${year}${month}${day}-${random}`;
    
    // بيانات Paylink API - استخدم المفاتيح من متغيرات البيئة
    const PAYLINK_APP_ID = process.env.PAYLINK_APP_ID;
    const PAYLINK_SECRET_KEY = process.env.PAYLINK_SECRET_KEY;
    
    // إعداد البيانات للإرسال لـ Paylink
    const invoiceData = {
      amount: amount,
      clientMobile: customerInfo.mobile || '966500000000',
      clientName: customerInfo.name || 'عميل متجر Moon',
      orderNumber: invoiceNumber,
      products: [{
        title: productName,
        price: amount,
        qty: 1
      }],
      displayCurrencyIso: 'SAR',
      note: `طلب من متجر Moon - ${productName}`,
      callBackUrl: `${event.headers.origin || 'https://moonstore.netlify.app'}/payment-success.html`,
      clientEmail: customerInfo.email || 'customer@moonstore.com',
      supportedCardBrands: ['mada', 'visaMastercard', 'amex'],
      isOpenInvoice: false
    };

    console.log('إرسال طلب لـ Paylink:', invoiceData);

    // استدعاء Paylink API
    const response = await fetch('https://restapi.paylink.sa/api/v1/invoice', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYLINK_APP_ID}:${PAYLINK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    const responseText = await response.text();
    console.log('Paylink Response Status:', response.status);
    console.log('Paylink Response:', responseText);

    let paymentData;
    try {
      paymentData = JSON.parse(responseText);
    } catch (e) {
      console.error('خطأ في تحليل الاستجابة:', e);
      throw new Error('استجابة غير صالحة من خدمة الدفع');
    }

    if (response.ok && paymentData) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          invoiceNumber,
          paymentUrl: paymentData.url,
          transactionNo: paymentData.transactionNo,
          message: 'تم إنشاء الفاتورة بنجاح'
        })
      };
    } else {
      const errorMessage = paymentData?.message || paymentData?.error || 'فشل في إنشاء الفاتورة';
      console.error('خطأ من Paylink:', paymentData);
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          details: paymentData
        })
      };
    }
  } catch (error) {
    console.error('خطأ في دالة create-invoice:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'خطأ في الخادم: ' + error.message
      })
    };
  }
};