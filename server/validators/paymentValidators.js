import ApiError from "../utils/ApiError.js";

export const validateCreateCheckoutPayload = (payload) => {
  if (payload === undefined || payload === null) return {};
  if (typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload");
  }
  return {};
};

export const validateVerifyRazorpayPaymentPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload");
  }

  const orderId = String(payload.razorpay_order_id || "").trim();
  const paymentId = String(payload.razorpay_payment_id || "").trim();
  const signature = String(payload.razorpay_signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "razorpay_order_id, razorpay_payment_id and razorpay_signature are required"
    );
  }

  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  };
};
