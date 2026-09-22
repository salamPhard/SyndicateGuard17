const express = require('express');

const path = require('path');

const app = express();


const dotenv = require('dotenv');

dotenv.config();  //Load env variables

app.use(express.json());  //middleware to parse json


const PORT = process.env.PORT || 5000;




const connectDB = require('./Config/dbConfig');
connectDB();  //connect to MongoDB

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});