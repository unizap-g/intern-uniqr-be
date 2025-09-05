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
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Token exchange successful" },
          400: { description: "Invalid API key" },
          401: { description: "Expired or invalid API key" },
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
    "/api/qr/create": {
      post: {
        summary: "Create a new QR code",
        tags: ["QR"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  qrName: { type: "string", example: "My QR" },
                  qrType: { type: "string", example: "URL" },
                  qrState: { type: "string", example: "static" },
                  charge: { type: "string", example: "Free" },
                  shape: { type: "string", example: "64f7c2e1a1b2c3d4e5f6a7b8", description: "Shape ObjectId" },
                  logo: { type: "string", example: "64f7c2e1a1b2c3d4e5f6a7b9", description: "Logo ObjectId" }
                  // ...other fields...
                },
                required: ["qrName", "qrType", "charge", "shape", "logo"]
              }
            }
          }
        },
        responses: {
          201: {
            description: "QR code created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    qr: {
                      type: "object",
                      properties: {
                        _id: { type: "string", example: "64f7c2e1a1b2c3d4e5f6a7c0" },
                        qrName: { type: "string", example: "My QR" },
                        shape: { type: "string", example: "64f7c2e1a1b2c3d4e5f6a7b8" },
                        logo: { type: "string", example: "64f7c2e1a1b2c3d4e5f6a7b9" }
                        // ...other fields...
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Validation error" },
          500: { description: "Internal server error" }
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
          summary: "Update authenticated user's profile",
          tags: ["User"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "john.doe@example.com"
                    },
                    dateOfBirth: {
                      type: "string",
                      example: "04-09-1990",
                      description: "Date of birth in dd-mm-yyyy format. User must be 13-120 years old."
                    },
                    gender: {
                      type: "string",
                      enum: ["Male", "Female", "Other", "Prefer not to say"],
                      example: "Male"
                    },
                    firstName: {
                      type: "string",
                      example: "John"
                    },
                    lastName: {
                      type: "string",
                      example: "Doe"
                    },
                    isActive: {
                      type: "boolean",
                      example: true
                    }
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
                      success: {
                        type: "boolean"
                      },
                      message: {
                        type: "string"
                      },
                      user: {
                        type: "object",
                        properties: {
                          email: {
                            type: "string"
                          },
                          dateOfBirth: {
                            type: "string"
                          },
                          gender: {
                            type: "string"
                          },
                          firstName: {
                            type: "string"
                          },
                          lastName: {
                            type: "string"
                          },
                          isActive: {
                            type: "boolean"
                          }
                        }
                      },
                      updatedFields: {
                        type: "array",
                        items: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            },
            400: {
              description: "Validation failed or no valid fields provided",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      message: {
                        type: "string"
                      },
                      errors: {
                        type: "array",
                        items: {
                          type: "string"
                        }
                      },
                      allowedFields: {
                        type: "array",
                        items: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            },
            409: {
              description: "Email already registered with another account",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      message: {
                        type: "string"
                      }
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
                      success: {
                        type: "boolean"
                      },
                      message: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            },
            500: {
              description: "Failed to update profile",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      message: {
                        type: "string"
                      },
                      error: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          }
        },
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
