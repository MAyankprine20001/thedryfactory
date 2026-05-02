import { Order } from "../models/Order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Coupon } from "../models/coupon.model.js";

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const products = await Product.find();
    
    // Revenue Calculation
    const orders = await Order.find({ status: "paid" });
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);

    // Recent orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "fullName email");

    // Low stock
    const lowStockAlerts = products.filter(p => p.stockCount < 10).length;

    // Today's Orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = await Order.countDocuments({ createdAt: { $gte: today } });

    // Pending Orders
    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        conversionRate: 3.24, // Placeholder for now
        todaysOrders,
        pendingOrders,
        lowStockAlerts,
        recentOrders
      }
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
    
    const updateData = { orderStatus };
    const timelineField = `${orderStatus.toLowerCase()}At`;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: { 
          orderStatus,
          [`timeline.${timelineField}`]: new Date() 
        } 
      }, 
      { new: true }
    );
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
