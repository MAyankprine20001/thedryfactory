import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "thedryfactory"
    });
    console.log("Connected to MongoDB (Database: thedryfactory)");


    const adminEmail = "hello@thedryfactory.com";
    const adminPassword = "Pass@123";

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      existingAdmin.role = "admin";
      existingAdmin.isEmailVerified = true;
      await existingAdmin.save();
      console.log("Admin user updated");
    } else {
      await User.create({
        fullName: "Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isEmailVerified: true,
      });
      console.log("Admin user created");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
