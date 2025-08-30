const fetch = require("node-fetch");

exports.handler = async (event) => {
  // السماح لـ CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  console.log("🔎 PAYLINK_APP_ID:", process.env.PAYLINK_APP_ID);
  console.log("🔎 PAYLINK_SECRET_KEY:", process.env.PAYLINK_SECRET_KEY);

  if (!process.env.PAYLINK_APP_ID || !process.env.PAYLINK_SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "❌ مفاتيح Paylink غير موجودة في البيئة"
      })
    };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://restapi.paylink.sa/api/invoice/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ApiId": process.env.PAYLINK_APP_ID,
        "SecretKey": process.env.PAYLINK_SECRET_KEY
      },
      body: JSON.stringify({
        amount: body.amount || 100,
        orderNumber: Date.now().toString(),
        customerName: body.customerInfo?.name || "عميل",
        customerEmail: body.customerInfo?.email || "customer@example.com",
        customerMobile: body.customerInfo?.mobile || "966500000000",
        callBackUrl: "https://moonhub-shop.netlify.app/payment-success.html"
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        paymentUrl: data.url,
        invoiceNumber: data.invoiceNumber
      })
    };

  } catch (err) {
    console.error("خطأ:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "❌ فشل إنشاء الفاتورة",
        details: err.message
      })
    };
  }
};
