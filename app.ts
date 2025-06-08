import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";

import config from "./src/config/config";
import connectDB from "./src/config/db";
import userRoutes from "./src/routes/auth.routes";
import groupRoutes from "./src/routes/group.routes";
import paymentRoutes from "./src/routes/payment.routes";

const app: Application = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use(config.api.prefix + "/users", userRoutes);
app.use(config.api.prefix + "/groups", groupRoutes);
app.use(config.api.prefix + "/payments", paymentRoutes);

// Initialize database connection
connectDB();

// Start server
const PORT: number = Number(config.port) || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});