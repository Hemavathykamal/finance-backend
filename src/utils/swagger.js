const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finance Dashboard API",
      version: "1.0.0",
      description: "A role-based finance record management API built by Hemavathy K.",
      contact: {
        name: "Hemavathy K",
        email: "hemavathykamal08@gmail.com",
      },
    },
    servers: [
      {
        url: "https://finance-backend-veow.onrender.com",
        description: "Live server",
      },
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Login via POST /api/auth/login to get a token, then paste it here.",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id:         { type: "string", example: "uuid-here" },
            name:       { type: "string", example: "Hemavathy K" },
            email:      { type: "string", example: "hemavathykamal08@gmail.com" },
            role:       { type: "string", enum: ["viewer", "analyst", "admin"] },
            status:     { type: "string", enum: ["active", "inactive"] },
            created_at: { type: "string", example: "2026-04-04 10:00:00" },
          },
        },
        FinancialRecord: {
          type: "object",
          properties: {
            id:              { type: "string" },
            amount:          { type: "number", example: 5000 },
            type:            { type: "string", enum: ["income", "expense"] },
            category:        { type: "string", example: "Salary" },
            date:            { type: "string", example: "2026-04-01" },
            notes:           { type: "string", example: "Monthly salary" },
            created_by_name: { type: "string", example: "Admin User" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Something went wrong" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            error:   { type: "string", example: "Validation failed" },
            details: {
              type: "object",
              example: { amount: "Amount is required" },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth",      description: "Login, register, and get current user" },
      { name: "Records",   description: "Create, view, update, and delete financial records" },
      { name: "Dashboard", description: "Summary and analytics endpoints" },
      { name: "Users",     description: "User management (admin only)" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;