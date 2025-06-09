import express, { Application } from "express";
import cors from "cors";
import config from "./src/config/config";
import connectDB from "./src/config/db";  
import authRoutes from "./src/routes/auth.routes";
import userRoutes from "./src/routes/auth.routes";
import groupRoutes from "./src/routes/group.routes";
import paymentRoutes from "./src/routes/payment.routes";
import authService from "./src/services/auth.service";
import { UserRole } from "./src/types/types";
import { ensureSuperAdmin } from "./src/utils/superAdmin";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(config.api.prefix + "/auth", authRoutes);
app.use(config.api.prefix + "/users", userRoutes);
app.use(config.api.prefix + "/groups", groupRoutes);
app.use(config.api.prefix + "/payments", paymentRoutes);

// Initialize database connection
connectDB();

// Ensure super admin exists
ensureSuperAdmin();

// Start server
const PORT: number = Number(config.port) || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});