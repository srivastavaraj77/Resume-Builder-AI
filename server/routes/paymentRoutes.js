import express from "express";
import {
  createRazorpayOrder,
  getPaymentStatus,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";
import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  validateCreateCheckoutPayload,
  validateVerifyRazorpayPaymentPayload,
} from "../validators/paymentValidators.js";

const paymentRouter = express.Router();

paymentRouter.post(
  "/create-order",
  protect,
  validateRequest(validateCreateCheckoutPayload),
  createRazorpayOrder
);
paymentRouter.post(
  "/verify",
  protect,
  validateRequest(validateVerifyRazorpayPaymentPayload),
  verifyRazorpayPayment
);
paymentRouter.get("/status", protect, getPaymentStatus);

export default paymentRouter;
