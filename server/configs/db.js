import mongoose from "mongoose";

let listenersAttached = false;

const registerConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    console.log("Database connected successfully");
  });

  mongoose.connection.on("error", (error) => {
    console.error("Database connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("Database disconnected");
  });
};

const connectDB = async () => {
  const mongoDbUri = process.env.MONGODB_URI;

  if (!mongoDbUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  registerConnectionListeners();
  await mongoose.connect(mongoDbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
};

export default connectDB;
