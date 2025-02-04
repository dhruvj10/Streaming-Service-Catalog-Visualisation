const mongoose = require('mongoose');

const uri = "mongodb+srv://Smrao4:changeme@478projectdb.gbwao.mongodb.net/Titles?retryWrites=true&w=majority&appName=478ProjectDb"; // Replace with your MongoDB URI if it's different

const connectDB = async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
};

module.exports = connectDB;