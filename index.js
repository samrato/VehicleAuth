const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./config/db"); // import your Postgres pool

const routes = require("./routes/routes");

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = ["http://localhost:8081"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Blocked by CORS: ${origin}`);
        callback(new Error("CORS Policy Violation: Access Denied"));
      }
    },
    credentials: true,
  })
);

app.use("/api", routes);

const PORT = process.env.PORT || 5000;


async function startServer() {
  try {
    // Test DB connection once on startup
    await pool.query("SELECT 1");
    console.log("Database connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1); // Exit if DB connection fails
  }
}

startServer();
