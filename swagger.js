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
                  countryCode: { type: "string", example: "91" },
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
                  countryCode: { type: "string", example: "91" },
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
    "/auth/exchange-tokens": {
      post: {
        summary: "Exchange UUID API key for JWT tokens",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  uuidApiKey: { type: "string", example: "bz_123e4567-e89b-12d3-a456-426614174000" }
                },
                required: ["uuidApiKey"]
              }
            }
          }
        },
        responses: {
          200: { description: "Token exchange successful" },
          400: { description: "Invalid API key" },
          401: { description: "Expired or invalid API key" }
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
    "/auth/signout": {
      post: {
        summary: "Sign out user and invalidate session",
        description: "Signs out the authenticated user by invalidating their session in Redis. NO PARAMETERS REQUIRED - only Authorization header with Bearer token is needed.",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        parameters: [],
        responses: {
          200: { 
            description: "Sign out successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Sign out successful. Session terminated securely." }
                  }
                }
              }
            }
          },
          401: { 
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "No token provided." }
                  }
                }
              }
            }
          },
          500: { 
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "An internal server error occurred during sign out." }
                  }
                }
              }
            }
          }
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
          200: { 
            description: "User profile data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: {
                      type: "object",
                      properties: {
                        _id: { type: "string", example: "507f1f77bcf86cd799439011" },
                        countryCode: { type: "string", example: "91" },
                        mobileNumber: { type: "string", example: "9876543210" },
                        fullName: { type: "string", example: "John Doe" },
                        email: { type: "string", example: "john@example.com" },
                        dateOfBirth: { type: "string", format: "date", example: "1990-01-15" },
                        gender: { type: "string", enum: ["Male", "Female", "Other", "Prefer not to say"], example: "Male" }
                      }
                    }
                  },
                  example: {
                    "success": true,
                    "user": {
                      "_id": "507f1f77bcf86cd799439011",
                      "countryCode": "91",
                      "mobileNumber": "9876543210", 
                      "fullName": "John Doe",
                      "email": "john@example.com",
                      "dateOfBirth": "1990-01-15",
                      "gender": "Male"
                    }
                  }
                }
              }
            }
          },
          401: { 
            description: "Unauthorized - Missing or invalid token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "No token provided." }
                  }
                }
              }
            }
          }
        }
      },
      patch: {
        summary: "Update user profile",
        description: "Update user profile information. Only specified fields will be updated. Email uniqueness is enforced.",
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { 
                    type: "string", 
                    example: "John Doe Updated",
                    description: "Full name (minimum 2 characters)",
                    minLength: 2
                  },
                  email: { 
                    type: "string", 
                    format: "email", 
                    example: "updated@example.com",
                    description: "Valid email address (must be unique)"
                  },
                  dateOfBirth: { 
                    type: "string", 
                    format: "date", 
                    example: "1990-01-15",
                    description: "Date of birth (user must be 13-120 years old)"
                  },
                  gender: { 
                    type: "string", 
                    enum: ["Male", "Female", "Other", "Prefer not to say"], 
                    example: "Male",
                    description: "Gender selection from allowed values"
                  }
                },
                additionalProperties: false,
                example: {
                  "fullName": "John Smith Updated",
                  "email": "john.updated@example.com",
                  "gender": "Male"
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Profile updated successfully" },
                    user: {
                      type: "object",
                      properties: {
                        _id: { type: "string", example: "507f1f77bcf86cd799439011" },
                        countryCode: { type: "string", example: "91" },
                        mobileNumber: { type: "string", example: "9876543210" },
                        fullName: { type: "string", example: "John Doe" },
                        email: { type: "string", example: "john@example.com" },
                        dateOfBirth: { type: "string", format: "date", example: "1990-01-15" },
                        gender: { type: "string", example: "Male" }
                      }
                    },
                    updatedFields: {
                      type: "array",
                      items: { type: "string" },
                      example: ["fullName", "email"]
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Validation failed" },
                    errors: {
                      type: "array",
                      items: { type: "string" },
                      example: ["Full name must be at least 2 characters long", "Please provide a valid email address"]
                    },
                    allowedFields: {
                      type: "array",
                      items: { type: "string" },
                      example: ["fullName", "email", "dateOfBirth", "gender"]
                    }
                  }
                }
              }
            }
          },
          401: { 
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "No token provided." }
                  }
                }
              }
            }
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "User not found." }
                  }
                }
              }
            }
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Email is already registered with another account" }
                  }
                }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Failed to update profile" },
                    error: { type: "string", example: "Database connection error" }
                  }
                }
              }
            }
          }
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
