export default async function handler(req, res) {
  // السماح بالوصول من موقعك
  res.setHeader("Access-Control-Allow-Origin", "https://moonhub.store");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, customerName, productName } = req.body;

  try {
    const response = await fetch("https://restapi.paylink.sa/api/addInvoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ApiId": process.env.PAYLINK_API_ID,
        "SecretKey": process.env.PAYLINK_SECRET_KEY,
      },
      body: JSON.stringify({
        amount,
        clientName: customerName || "عميل المتجر",
        orderNumber: Date.now().toString(),
        products: [
          { title: productName || "منتج", price: amount, qty: 1 },
        ],
        callBackUrl: "https://moonhub.store/success",
        cancelUrl: "https://moonhub.store/cancel",
      }),
    });

    const text = await response.text(); // ناخذ الرد نصياً
    console.log("⚡ Paylink Raw Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ Paylink API Error:", error);
    res.status(500).json({ error: "Failed to create invoice", details: error.message });
  }
}
