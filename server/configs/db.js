import mongoose from "mongoose";

const connectDB = async () => {
  const mongoDbUri = process.env.MONGODB_URI;

  if (!mongoDbUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  mongoose.connection.on("connected", () => {
    console.log("Database connected successfully");
  });

  await mongoose.connect(mongoDbUri);
};

export default connectDB;
