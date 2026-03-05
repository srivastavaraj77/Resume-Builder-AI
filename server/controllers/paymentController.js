import crypto from "crypto";
import Razorpay from "razorpay";
import User from "../models/User.js";
import { getEntitlements } from "../utils/entitlements.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendResponse.js";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new ApiError(500, "PAYMENT_CONFIG_ERROR", "Razorpay keys are not configured");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getProAmountPaise = () => {
  const amountPaise = Number(process.env.RAZORPAY_PRO_AMOUNT_PAISE || 200);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new ApiError(500, "PAYMENT_CONFIG_ERROR", "RAZORPAY_PRO_AMOUNT_PAISE must be a positive number");
  }
  return amountPaise;
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const razorpay = getRazorpayClient();
    const amountPaise = getProAmountPaise();
    const user = await User.findById(req.userId);

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `user_${user._id}_${Date.now()}`.slice(0, 40),
      notes: {
        userId: String(user._id),
        plan: "pro",
      },
    });

    user.razorpayOrderId = order.id;
    await user.save();

    return sendSuccess(res, {
      message: "Razorpay order created",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || "",
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.validatedBody;
    const webhookSecret = process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      throw new ApiError(500, "PAYMENT_CONFIG_ERROR", "RAZORPAY_KEY_SECRET is not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "PAYMENT_VERIFICATION_FAILED", "Payment verification failed");
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    if (user.razorpayOrderId && user.razorpayOrderId !== razorpay_order_id) {
      throw new ApiError(400, "PAYMENT_ORDER_MISMATCH", "Order does not belong to this user");
    }

    user.plan = "pro";
    user.subscriptionStatus = "active";
    user.razorpayOrderId = razorpay_order_id;
    user.razorpayPaymentId = razorpay_payment_id;
    user.razorpaySignature = razorpay_signature;
    await user.save();

    return sendSuccess(res, {
      message: "Payment verified and Pro plan activated",
      data: {
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return sendSuccess(res, {
      message: "Payment status fetched successfully",
      data: {
        user,
        entitlements: getEntitlements(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ success: false, error: "Missing webhook secret" });
  }

  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body || {});
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    if (!signature || signature !== expectedSignature) {
      return res.status(400).json({ success: false, error: "Invalid webhook signature" });
    }

    const event = JSON.parse(body);
    if (event?.event === "payment.captured") {
      const entity = event?.payload?.payment?.entity;
      const paymentId = entity?.id;
      const orderId = entity?.order_id;
      if (paymentId && orderId) {
        await User.findOneAndUpdate(
          { razorpayOrderId: orderId },
          {
            plan: "pro",
            subscriptionStatus: "active",
            razorpayPaymentId: paymentId,
          }
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
