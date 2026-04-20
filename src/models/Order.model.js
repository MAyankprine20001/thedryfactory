import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default: "",
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: "" },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        // Link to logged-in user (optional — guest checkout supported)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Cart items snapshot at time of purchase
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Order must have at least one item",
            },
        },

        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
        },

        // Pricing breakdown
        subtotal: { type: Number, required: true },   // sum of items
        shipping: { type: Number, required: true },   // 0 or 50
        total: { type: Number, required: true },      // subtotal + shipping (in ₹)

        // Razorpay fields
        razorpay: {
            orderId: { type: String, default: null },    // created by backend before payment
            paymentId: { type: String, default: null },  // filled after successful payment
            signature: { type: String, default: null },  // filled after verification
        },

        // Order lifecycle
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded", "cancelled"],
            default: "pending",
        },

        // Optional: notes from customer
        notes: { type: String, default: "" },
    },
    {
        timestamps: true, // adds createdAt & updatedAt
    }
);

// Index for fast lookup by razorpay orderId
orderSchema.index({ "razorpay.orderId": 1 });

// Index for fetching orders by user
orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);