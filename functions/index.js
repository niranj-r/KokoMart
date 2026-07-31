const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const twilio = require("twilio");

admin.initializeApp();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || "";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "";
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "";

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    logger.warn("Razorpay API keys are missing. Please check your Firebase environment variables.");
}

let razorpayInstance = null;
function getRazorpay() {
    if (!razorpayInstance) {
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay API keys are missing. Please check your Firebase environment variables.");
        }
        razorpayInstance = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
}

exports.createRazorpayOrderV2 = onCall({ cors: true, invoker: "public" }, async (request) => {
    // We bypassed auth check for now, to ensure no client issues.
    
    const amount = request.data.amount;
    const currency = request.data.currency || "INR";

    if (!amount) {
        throw new HttpsError("invalid-argument", "The function must be called with an 'amount'.");
    }

    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt: `receipt_order_${Date.now()}`,
    };

    try {
        const order = await getRazorpay().orders.create(options);
        logger.info("Razorpay Order Created", { orderId: order.id });
        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    } catch (error) {
        logger.error("Error creating Razorpay order:", error);
        throw new HttpsError("internal", "Failed to create Razorpay order.");
    }
});

exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
    if (!event.data) {
        logger.error("No data associated with the event");
        return;
    }

    const order = event.data.data();

    // Get customer name from users collection
    let customerName = "Customer";
    let customerPhone = "";
    if (order.user_id) {
        try {
            const userDoc = await admin.firestore().collection("users").doc(order.user_id).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                customerName = userData.name || "Customer";
                customerPhone = userData.phone || "";
            }
        } catch (error) {
            logger.error("Error fetching user data for notification", error);
        }
    }

    // Format the items
    let itemsList = "";
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            const cuttingType = item.cuttingType ? ` (${item.cuttingType})` : "";
            itemsList += `- ${item.name} x${item.quantity} [${item.weight}${item.unit}]${cuttingType}\n`;
        });
    }

    // Extract relevant data
    const finalAmount = order.final_amount || 0;
    const paymentMode = (order.payment_method || "COD").toUpperCase();

    // Construct the WhatsApp message using Markdown
    const messageBody = `*New Order Alert!* 🚨\n
*Order ID:* ${order.display_id || event.params.orderId}
*Customer:* ${customerName}
*Phone:* ${customerPhone}
*Address:* ${order.address || 'N/A'}
*Delivery Slot:* ${order.delivery_slot || 'N/A'}
*Note:* ${order.note || 'None'}\n
*Items:*
${itemsList}
*Total:* ₹${finalAmount}
*Payment:* ${paymentMode}`;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !ADMIN_WHATSAPP_NUMBER) {
        logger.warn("Twilio credentials or numbers missing. Cannot send WhatsApp notification.");
        return;
    }

    try {
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        
        // Ensure numbers have the "whatsapp:" prefix
        const fromNumber = TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') ? TWILIO_WHATSAPP_FROM : `whatsapp:${TWILIO_WHATSAPP_FROM}`;
        const toNumber = ADMIN_WHATSAPP_NUMBER.startsWith('whatsapp:') ? ADMIN_WHATSAPP_NUMBER : `whatsapp:${ADMIN_WHATSAPP_NUMBER}`;

        await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: toNumber
        });

        logger.info(`WhatsApp notification successfully sent to admin for order ${event.params.orderId}`);
    } catch (error) {
        logger.error("Error sending WhatsApp notification via Twilio:", error);
    }
});
