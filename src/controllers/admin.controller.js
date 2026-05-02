import mongoose from "mongoose";
import { Order } from "../models/Order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";

function pctDelta(curr, prev) {
  if (prev === undefined || prev === null || prev === 0)
    return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function utcDayStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function fillDailyMetricUtc(aggRows, days, valueField) {
  const map = {};
  aggRows.forEach((r) => {
    map[r._id] = Math.round(r[valueField] || 0);
  });
  const out = [];
  const todayStart = utcDayStart();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    out.push({ name: label, sales: map[key] || 0 });
  }
  return out;
}

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = utcDayStart(now);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const fourteenDaysAgo = new Date(todayStart);
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const paidOrdersAll = await Order.find({ status: "paid" }).select("total").lean();
    const totalRevenue = paidOrdersAll.reduce((acc, o) => acc + o.total, 0);

    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const [
      currRevAgg,
      prevRevAgg,
      currOrdersCount,
      prevOrdersCount,
      customersCurr,
      customersPrev,
      paid30,
      attempted30,
      salesAgg,
      ordersSparkAgg,
      signupAgg,
      topProductsAgg,
      recentOrders,
      products,
      todaysOrders,
      pendingOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, s: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "paid",
            createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
          },
        },
        { $group: { _id: null, s: { $sum: "$total" } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: sevenDaysAgo },
      }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
      Order.countDocuments({
        status: "paid",
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            sales: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        {
          $match: {
            role: "customer",
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            signups: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: sevenDaysAgo } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            sold: { $sum: "$items.quantity" },
            image: { $first: "$items.image" },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "fullName email phone"),
      Product.find().lean(),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ orderStatus: "Pending" }),
    ]);

    const revenueCurr = currRevAgg[0]?.s || 0;
    const revenuePrev = prevRevAgg[0]?.s || 0;

    const conversionRate =
      attempted30 === 0 ? 0 : Math.round((paid30 / attempted30) * 10000) / 100;

    const salesOverview = fillDailyMetricUtc(salesAgg, 7, "sales");
    const ordersTrend = fillDailyMetricUtc(ordersSparkAgg, 7, "orders");
    const customersTrend = fillDailyMetricUtc(signupAgg, 7, "signups");
    const conversionTrend = salesOverview.map((row) => ({
      name: row.name,
      sales: conversionRate,
    }));

    const topProducts = await Promise.all(
      topProductsAgg.map(async (row) => {
        let category = "";
        try {
          const pid = row._id;
          if (mongoose.Types.ObjectId.isValid(pid)) {
            const p = await Product.findById(pid).select("category").lean();
            category = p?.category || "";
          }
        } catch (_) {
          /* ignore */
        }
        return {
          productId: row._id,
          name: row.name,
          sold: row.sold,
          image: row.image || "",
          category,
        };
      })
    );

    const lowStockAlerts = products.filter((p) => p.stockCount < 10).length;

    const deltas = {
      revenuePct: pctDelta(revenueCurr, revenuePrev),
      ordersPct: pctDelta(currOrdersCount, prevOrdersCount),
      customersPct: pctDelta(customersCurr, customersPrev),
      conversionPct: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        revenueLast7Days: revenueCurr,
        totalOrders,
        totalCustomers,
        conversionRate,
        todaysOrders,
        pendingOrders,
        lowStockAlerts,
        recentOrders,
        salesOverview,
        ordersTrend,
        customersTrend,
        conversionTrend,
        topProducts,
        deltas,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const paidOrders = await Order.find({ status: "paid" });
    
    // Group by category (simple mock for now based on items)
    const revenueByCategory = {
      "Fruit Chunks": 40,
      "Smoothie Premix": 30,
      "Chocolates": 20,
      "Powders": 10
    };

    const revenueByPaymentMethod = {
      "UPI": 52,
      "Razorpay": 28,
      "COD": 15,
      "Net Banking": 5
    };

    res.status(200).json({
      success: true,
      data: {
        revenueByCategory,
        revenueByPaymentMethod,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/customers
export const getCustomersList = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 });
    // In a real app, you'd aggregate Total Spent from Orders per customer
    
    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/inventory
export const getInventory = async (req, res) => {
  try {
    const products = await Product.find().sort({ stockCount: 1 });
    
    let totalStockValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach(p => {
      totalStockValue += (p.price * p.stockCount);
      if (p.stockCount === 0) outOfStock++;
      else if (p.stockCount < 10) lowStock++;
      else inStock++;
    });

    res.status(200).json({
      success: true,
      data: {
        products,
        kpis: {
          totalProducts: products.length,
          inStock,
          lowStock,
          outOfStock,
          totalStockValue
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "fullName email phone").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    if (!orderStatus) {
      return res.status(400).json({ success: false, message: "orderStatus required" });
    }

    const timelineField = `${orderStatus.toLowerCase()}At`;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          orderStatus,
          [`timeline.${timelineField}`]: new Date(),
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
