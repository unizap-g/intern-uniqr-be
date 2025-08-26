// swagger.js

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "BiZap API",
    version: "1.0.0",
    description: "API documentation for BiZap authentication and user management."
  },
  servers: [
    { url: process.env.API_URL || "http://localhost:3000/api" }
  ],
  paths: {
    "/auth/send-otp": {
      post: {
        summary: "Send OTP to mobile number",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  countryCode: { type: "string", example: "+91" },
                  mobileNumber: { type: "string", example: "9876543210" }
                },
                required: ["countryCode", "mobileNumber"]
              }
            }
          }
        },
        responses: {
          200: { description: "OTP sent successfully" },
          400: { description: "Validation error" },
          500: { description: "Internal server error" }
        }
      }
    },
    "/auth/verify-otp": {
      post: {
        summary: "Verify OTP and sign up/login",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  countryCode: { type: "string", example: "+91" },
                  mobileNumber: { type: "string", example: "9876543210" },
                  otp: { type: "string", example: "123456" }
                },
                required: ["countryCode", "mobileNumber", "otp"]
              }
            }
          }
        },
        responses: {
          201: { description: "Authentication successful" },
          400: { description: "Validation error" },
          500: { description: "Internal server error" }
        }
      }
    },
    "/auth/refresh-token": {
      post: {
        summary: "Refresh access token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string", example: "your-refresh-token" }
                },
                required: ["refreshToken"]
              }
            }
          }
        },
        responses: {
          200: { description: "New access token issued" },
          400: { description: "Invalid refresh token" }
        }
      }
    },
    "/auth/protected": {
      get: {
        summary: "Protected route (requires authentication)",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Authenticated access" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/user/profile": {
      get: {
        summary: "Get user profile",
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User profile data" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
          200: { description: "Service is healthy" },
          503: { description: "Service unavailable" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth API',
      version: '1.0.0',
      description: 'API documentation for authentication endpoints',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api/',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default function setupSwagger(app) {
  // Use .env for docs route and API URL
  const docsRoute = process.env.DOCS_URL ? new URL(process.env.DOCS_URL).pathname : '/api-docs';
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

  // Dynamically set server URL in OpenAPI spec
  if (swaggerDocument.servers) {
    swaggerDocument.servers[0].url = apiUrl;
  } else {
    swaggerDocument.servers = [{ url: apiUrl }];
  }

  app.use(docsRoute, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
