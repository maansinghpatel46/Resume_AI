const mongoose = require("mongoose");

module.exports = async function connectDB() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("\n❌ MongoDB Connection Failed");
    console.error("Error:", error.message);

    if (error.reason?.servers) {
      for (const [address, server] of error.reason.servers) {
        console.error("\nServer:", address);
        console.error("Server Type:", server.type);
        console.error(
          "Server Error:",
          server.error?.message || "No detailed error",
        );
        console.error("Error Code:", server.error?.code || "N/A");
      }
    }

    throw error;
  }
};
