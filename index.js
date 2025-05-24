const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require('node-cron');
const pool = require("./config/db"); // import your Postgres pool

const routes = require("./routes/routes");

dotenv.config();

const app = express();
app.use(express.json());



const allowedOrigins = ["http://localhost:3000"];

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

app.get('/', (req, res) => {
  res.send('API is running');
});



async function startServer() {
  try {
    // Test DB connection once on startup
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully.");

    // 🕒 Start the cron job that runs every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('⏰ Running cron job every 15 minutes');

      try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`📊 Total users in the database: ${result.rows[0].count}`);
      } catch (err) {
        console.error('❌ Cron job DB error:', err.message);
      }
    });

    // 🚀 Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error.message);
    process.exit(1); // Exit if DB connection fails
  }
}
startServer();


