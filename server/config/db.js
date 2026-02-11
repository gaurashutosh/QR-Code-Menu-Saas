import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || DB_NAME;

    // If the URI already contains a slash after the host, don't append DB_NAME
    // This is a simple check; more robust logic could be added if needed
    const connectionString =
      mongoURI.includes("/", 10) && !mongoURI.endsWith("/")
        ? mongoURI
        : `${mongoURI.replace(/\/$/, "")}/${dbName}`;

    const conn = await mongoose.connect(connectionString);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
