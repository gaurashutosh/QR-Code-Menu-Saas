import axios from "axios";

const CASHFREE_ENV = process.env.CASHFREE_ENV || "TEST";
const BASE_URL =
  CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const cashfree = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-client-id": process.env.CASHFREE_CLIENT_ID,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  },
});

export default cashfree;
