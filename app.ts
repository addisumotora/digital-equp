import config from "./src/config/config";
import connectDB from "./src/config/db";


// Initialize database connection
connectDB();

// Use config values
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});