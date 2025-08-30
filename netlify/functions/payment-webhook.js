const crypto = require('crypto');

exports.handler = async (event, context) => {
  console.log('Webhook received:', event.httpMethod);
  
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const webhookData = JSON.parse(event.body);
    console.log('Webhook data:', webhookData);

    // التحقق من صحة البيانات الواردة
    if (!webhookData || !webhookData.eventType) {
      console.error('بيانات webhook غير صالحة');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid webhook data' })
      };
    }

    // معالجة أحداث الدفع المختلفة
    switch (webhookData.eventType) {
      case 'invoice.paid':
        await handlePaymentSuccess(webhookData.data);
        break;
      case 'invoice.failed':
        await handlePaymentFailure(webhookData.data);
        break;
      case 'invoice.cancelled':
        await handlePaymentCancellation(webhookData.data);
        break;
      default:
        console.log('نوع حدث غير معروف:', webhookData.eventType);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        received: true,
        message: 'Webhook processed successfully' 
      })
    };

  } catch (error) {
    console.error('خطأ في معالجة webhook:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

// معالجة نجاح الدفع
async function handlePaymentSuccess(paymentData) {
  console.log('تم الدفع بنجاح:', paymentData);
  
  const { orderNumber, amount, clientName, clientMobile, clientEmail } = paymentData;
  
  try {
    // إرسال إشعار واتساب للإدارة
    await sendAdminNotification({
      type: 'payment_success',
      orderNumber,
      amount,
      clientName,
      clientMobile
    });

    // يمكن إضافة إرسال إيميل تأكيد للعميل هنا
    await sendCustomerConfirmation({
      orderNumber,
      amount,
      clientName,
      clientEmail
    });

    console.log('تم إرسال الإشعارات بنجاح');
    
  } catch (error) {
    console.error('خطأ في إرسال الإشعارات:', error);
  }
}

// معالجة فشل الدفع
async function handlePaymentFailure(paymentData) {
  console.log('فشل في الدفع:', paymentData);
  
  // يمكن إضافة منطق إضافي هنا مثل إرسال تنبيه
  await sendAdminNotification({
    type: 'payment_failed',
    orderNumber: paymentData.orderNumber,
    reason: paymentData.failureReason || 'غير محدد'
  });
}

// معالجة إلغاء الدفع
async function handlePaymentCancellation(paymentData) {
  console.log('تم إلغاء الدفع:', paymentData);
  
  await sendAdminNotification({
    type: 'payment_cancelled',
    orderNumber: paymentData.orderNumber
  });
}

// إرسال إشعار للإدارة
async function sendAdminNotification(data) {
  console.log('إرسال إشعار للإدارة:', data);
  
  // يمكن دمج WhatsApp Business API أو Telegram Bot API هنا
  // أو إرسال إيميل للإدارة
  
  // مثال بسيط لتسجيل البيانات
  const timestamp = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
  console.log(`[${timestamp}] إشعار إدارة:`, JSON.stringify(data, null, 2));
}

// إرسال تأكيد للعميل
async function sendCustomerConfirmation(customerData) {
  console.log('إرسال تأكيد للعميل:', customerData);
  
  // يمكن استخدام EmailJS أو SendGrid أو خدمة إيميل أخرى
  // أو إرسال رسالة واتساب
  
  const confirmationMessage = `
شكراً ${customerData.clientName}!
تم استلام دفعتك بنجاح.
رقم الفاتورة: ${customerData.orderNumber}
المبلغ: ${customerData.amount} ريال
سنتواصل معك قريباً لتأكيد طلبك.
  `;
  
  console.log('رسالة التأكيد:', confirmationMessage);
}