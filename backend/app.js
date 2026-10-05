const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load env variables first

const userRoute = require("./Routes/userRoute");
const connectDB = require("./Config/dbConfig");
const { superUser } = require("./Controllers/users");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoute);

// Admin route
app.use("/api/admin", require("./Routes/adminRoute"));
app.use("/api/rate-limits", require("./Routes/rateLimitRoute"));
app.use("/api/usage", require("./Routes/usageRoute"));

// Start application
const startServer = async () => {
  try {
    await connectDB();

    await superUser();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();