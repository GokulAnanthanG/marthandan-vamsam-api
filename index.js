// ============================================================
// Environment Configuration
// ============================================================

const dotenv = require("dotenv");

const environment = process.env.NODE_ENV || "development";

dotenv.config({
    path: `.env.${environment}`
});


// ============================================================
// Imports
// ============================================================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");


// ============================================================
// App Initialization
// ============================================================

const app = express();


// ============================================================
// Environment Variables
// ============================================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL;


// ============================================================
// Security
// ============================================================

app.use(helmet());


// ============================================================
// CORS
// ============================================================

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true
    })
);


// ============================================================
// Request Logger
// ============================================================

// Development:
// GET /api/users 200 15.123 ms - 1250
//
// Production:
// Logs requests in Apache combined format

if (NODE_ENV === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}


// ============================================================
// Body Parser
// ============================================================

app.use(express.json({
    limit: "10mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}));


// ============================================================
// Compression
// ============================================================

app.use(compression());


// ============================================================
// Health Check
// ============================================================

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        environment: NODE_ENV
    });
});


// ============================================================
// Routes
// ============================================================

// Example:
// const userRoutes = require("./routes/user.routes");
// app.use("/api/users", userRoutes);


// ============================================================
// 404 Handler
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});


// ============================================================
// Global Error Handler
// ============================================================

app.use((err, req, res, next) => {

    console.error("ERROR:", err);

    const statusCode = err.status || 500;

    res.status(statusCode).json({
        success: false,
        message:
            NODE_ENV === "production"
                ? "Internal server error"
                : err.message
    });
});


// ============================================================
// Start Server
// ============================================================

const server = app.listen(PORT, () => {

    console.log("======================================");
    console.log("🚀 API SERVER STARTED");
    console.log("======================================");
    console.log(`Environment : ${NODE_ENV}`);
    console.log(`Port        : ${PORT}`);
    console.log(`Frontend    : ${FRONTEND_URL}`);
    console.log(`Health      : http://localhost:${PORT}/health`);
    console.log("======================================");

});


// ============================================================
// Graceful Shutdown
// ============================================================

const shutdown = (signal) => {

    console.log(`\n${signal} received. Shutting down server...`);

    server.close(() => {

        console.log("HTTP server closed successfully.");

        process.exit(0);

    });

    // Force shutdown after 10 seconds
    setTimeout(() => {

        console.error(
            "Could not close connections in time. Forcefully shutting down."
        );

        process.exit(1);

    }, 10000);

};


// Handle termination signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));