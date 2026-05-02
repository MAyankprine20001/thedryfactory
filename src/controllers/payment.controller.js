import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import { Order } from "../models/Order.model.js";
import { User } from "../models/user.model.js";
import {
    encodeCursor,
    decodeCursor,
    compoundLtFilter,
    escapeRegex,
} from "../utils/cursorPagination.js";
import { environmentVariables } from "../config/config.env.js";

// ─── Razorpay instance ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
    key_id: environmentVariables.RAZORPAY.KEY_ID,
    key_secret: environmentVariables.RAZORPAY.KEY_SECRET,
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/** Filters shared by admin order list + stats (no orderStatus tab filter). */
function buildOrdersBaseFilter({ search, paymentStatus, paymentMethod }) {
    const filter = {};

    if (paymentStatus && paymentStatus !== "All") {
        filter.status = paymentStatus.toLowerCase();
    }

    if (paymentMethod && paymentMethod !== "All") {
        filter.paymentMethod = paymentMethod;
    }

    if (search) {
        const searchConditions = [];
        const idStr = String(search).trim();
        if (mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24) {
            searchConditions.push({ _id: new mongoose.Types.ObjectId(idStr) });
        }
        const rx = new RegExp(escapeRegex(search.trim()), "i");
        searchConditions.push({ "shippingAddress.fullName": rx });
        searchConditions.push({ "shippingAddress.phone": rx });
        searchConditions.push({ "razorpay.orderId": rx });
        filter.$and = [{ $or: searchConditions }];
    }

    return filter;
}

function buildOrdersListFilter({ search, paymentStatus, paymentMethod, orderStatus }) {
    const base = buildOrdersBaseFilter({ search, paymentStatus, paymentMethod });
    const tab = (orderStatus || "").trim();
    if (tab && tab !== "All Orders") {
        base.orderStatus = tab;
    }
    return base;
}

// ─── 1. Create Razorpay Order ─────────────────────────────────────────────────
/**
 * POST /api/payments/create-order
 *
 * Body: { items, shippingAddress, subtotal, shipping, total, notes? }
 *
 * Flow:
 *   1. Validate request
 *   2. Create order in Razorpay (amount in paise)
 *   3. Save pending Order doc in MongoDB
 *   4. Return razorpay order details to frontend
 */
export const createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress, subtotal, shipping, total, notes } = req.body;

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!shippingAddress) {
        return res
            .status(400)
            .json({ success: false, message: "Shipping address is required" });
    }
    if (!total || total <= 0) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid order total" });
    }

    // Razorpay expects amount in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(total * 100);

    // Save address to user if they are logged in and don't have one
    if (req.user?.id) {
        const user = await User.findById(req.user.id);
        if (user && !user.address?.addressLine1) {
            user.address = {
                addressLine1: shippingAddress.addressLine1,
                addressLine2: shippingAddress.addressLine2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                phone: shippingAddress.phone,
            };
            await user.save({ validateBeforeSave: false });
        }
    }

    // Create order on Razorpay
    const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
            customerName: shippingAddress.fullName,
            customerPhone: shippingAddress.phone,
        },
    });

    // Save order in MongoDB with status "pending"
    const order = await Order.create({
        user: req.user?.id || null, // null for guest checkout
        items,
        shippingAddress,
        subtotal,
        shipping,
        total,
        notes: notes || "",
        razorpay: {
            orderId: razorpayOrder.id,
        },
        status: "pending",
    });

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
            // These go directly into the Razorpay checkout options on frontend
            orderId: razorpayOrder.id,       // rzp_order_id
            amount: razorpayOrder.amount,    // in paise
            currency: razorpayOrder.currency,
            dbOrderId: order._id,            // our MongoDB _id (save on frontend)
            keyId: environmentVariables.RAZORPAY.KEY_ID, // safe to send — it's public
        },
    });
});

// ─── 2. Verify Payment ────────────────────────────────────────────────────────
/**
 * POST /api/payments/verify
 *
 * Body: {
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature,
 *   dbOrderId           ← our MongoDB order _id
 * }
 *
 * Flow:
 *   1. Re-compute HMAC signature from order_id + payment_id
 *   2. Compare with signature sent by Razorpay
 *   3. If match → mark order as "paid" in MongoDB
 *   4. Return success
 */
export const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        dbOrderId,
    } = req.body;

    if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !dbOrderId
    ) {
        return res
            .status(400)
            .json({ success: false, message: "Missing payment verification fields" });
    }

    // HMAC-SHA256 verification — this is the official Razorpay way
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", environmentVariables.RAZORPAY.KEY_SECRET)
        .update(body)
        .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
        // Mark the order as failed in DB
        await Order.findByIdAndUpdate(dbOrderId, { status: "failed" });

        return res.status(400).json({
            success: false,
            message: "Payment verification failed — invalid signature",
        });
    }

    // Signature verified — update order to paid
    const updatedOrder = await Order.findByIdAndUpdate(
        dbOrderId,
        {
            status: "paid",
            "razorpay.paymentId": razorpay_payment_id,
            "razorpay.signature": razorpay_signature,
        },
        { new: true }
    );

    if (!updatedOrder) {
        return res
            .status(404)
            .json({ success: false, message: "Order not found in database" });
    }

    res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
            orderId: updatedOrder._id,
            razorpayPaymentId: razorpay_payment_id,
            amount: updatedOrder.total,
            status: updatedOrder.status,
        },
    });
});

// ─── 3. Get My Orders ─────────────────────────────────────────────────────────
/**
 * GET /api/payments/my-orders
 * Protected — requires login
 *
 * Returns all orders placed by the logged-in user
 */
export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-razorpay.signature"); // don't expose signature

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
    });
});

// ─── 4. Get Single Order ──────────────────────────────────────────────────────
/**
 * GET /api/payments/order/:orderId
 * Protected
 */
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).select(
        "-razorpay.signature"
    );

    if (!order) {
        return res
            .status(404)
            .json({ success: false, message: "Order not found" });
    }

    // Only the owner or an admin can view
    const isOwner = order.user?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, data: order });
});

// ─── 5. Admin — Order stats (tabs / totals for current filters) ────────────────
/**
 * GET /api/payments/admin/orders/stats
 */
export const getAdminOrderStats = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin only" });
    }

    const search = (req.query.search || "").trim();
    const paymentStatus = (req.query.paymentStatus || "").trim();
    const paymentMethod = (req.query.paymentMethod || "").trim();

    const matchFilter = buildOrdersBaseFilter({
        search,
        paymentStatus,
        paymentMethod,
    });

    const [agg, total] = await Promise.all([
        Order.aggregate([
            { $match: matchFilter },
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
        ]),
        Order.countDocuments(matchFilter),
    ]);

    const countsByStatus = {};
    agg.forEach((row) => {
        const key = row._id || "Pending";
        countsByStatus[key] = row.count;
    });

    res.status(200).json({
        success: true,
        total,
        countsByStatus,
    });
});

// ─── 6. Admin — Cursor-paginated orders + backend search ───────────────────────
/**
 * GET /api/payments/admin/orders
 * Query: limit, cursor, search, orderStatus, paymentStatus, paymentMethod
 */
export const getAllOrders = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin only" });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const cursorParam = req.query.cursor || null;
    const search = (req.query.search || "").trim();
    const paymentStatus = (req.query.paymentStatus || "").trim();
    const paymentMethod = (req.query.paymentMethod || "").trim();
    const orderStatus = (req.query.orderStatus || "").trim();

    const listFilter = buildOrdersListFilter({
        search,
        paymentStatus,
        paymentMethod,
        orderStatus,
    });

    const cursorDoc = decodeCursor(cursorParam);
    const lt = compoundLtFilter(cursorDoc);

    const parts = [];
    if (Object.keys(listFilter).length > 0) parts.push(listFilter);
    if (Object.keys(lt).length > 0) parts.push(lt);

    const mongoFilter =
        parts.length === 0 ? {} : parts.length === 1 ? parts[0] : { $and: parts };

    const orders = await Order.find(mongoFilter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .select("-razorpay.signature")
        .populate("user", "email fullName phone");

    const hasNextPage = orders.length > limit;
    const slice = hasNextPage ? orders.slice(0, limit) : orders;
    const nextCursor =
        hasNextPage && slice.length > 0
            ? encodeCursor(slice[slice.length - 1])
            : null;

    const total = await Order.countDocuments(listFilter);

    res.status(200).json({
        success: true,
        data: slice,
        nextCursor,
        hasNextPage,
        limit,
        total,
    });
});

// ─── Global error handler for this controller ─────────────────────────────────
export const paymentErrorHandler = (err, req, res, next) => {
    console.error("Payment Error:", err);

    // Razorpay API errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.error?.description || "Razorpay error",
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error during payment processing",
        error: err.message,
    });
};