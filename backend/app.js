const express = require("express");

const userRoute = require("./Routes/userRoute");

const path = require("path");

const app = express();

// NOTE: dotenv.config() should run first, before other files are imported
const dotenv = require("dotenv");

dotenv.config(); //Load env variables

app.use(express.json()); //middleware to parse json

const PORT = process.env.PORT || 5000;

// BUG: connectDB() isn't awaited, so the server starts listening before MongoDB connects
const connectDB = require("./Config/dbConfig");
connectDB(); //connect to MongoDB

// NOTE: leftover static route; the uploads folder doesn't exist
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoute);

//Admin route
app.use("/api/admin", require("./Routes/adminRoute"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
