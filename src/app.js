const express = require("express");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");

const authRoutes      = require("./routes/authRoutes");
const userRoutes      = require("./routes/userRoutes");
const recordRoutes    = require("./routes/recordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// parse incoming requests as JSON
app.use(express.json());

// swagger docs available at /api-docs
// this gives a nice interactive UI to test all endpoints
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Finance API Docs",
  customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
}));

// general rate limiter - 200 requests per 15 minutes for all routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// stricter limit on auth routes to prevent brute force login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later." },
});

// register all route groups
app.use("/api/auth",      authLimiter, authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/records",   recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// simple health check so we can verify the server is running
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// catch any route that doesn't exist
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// global error handler - catches errors thrown from any route or service
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  if (status === 500) {
    console.error("[ERROR]", err);
  }
  res.status(status).json({ error: message });
});

// wait for the database to be ready before starting the server
const { bootstrap } = require("./models/db");
const PORT = process.env.PORT || 3000;

bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Finance Backend running on http://localhost:${PORT}`);
      console.log(`Swagger Docs:   http://localhost:${PORT}/api-docs`);
      console.log(`Health check:   http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialise database:", err);
    process.exit(1);
  });

module.exports = app;
