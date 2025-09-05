import mongoose from "mongoose";

// Define the main QR Code schema
const qrCodeSchema = new mongoose.Schema(
  {
    // Section 1: QR Name (mandatory for all QR types)
    qrName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      // validate: {
      //   validator: function (v) {
      //     // Only allow names from a predefined list
      //     const allowedNames = [
      //       "MyFirstWebsite",
      //       "MyBusinessCard",
      //       "MyEvent",
      //       "MyMenu",
      //       "MyCatalogue",
      //       "MyResume",
      //       "MyApp",
      //       "MyPDF",
      //       "MyGallery",
      //       "MyVideo",
      //       "MySocialLinks",
      //       "MyLeadForm",
      //       "MyReview",
      //       "MyLandingPage",
      //       "MyListOfLinks",
      //     ];
      //     return allowedNames.includes(v);
      //   },
      //   message: (props) => `${props.value} is not an allowed QR name!`,
      // },
    },

    // QR Type and State
    qrType: {
      type: String,
      required: true,
      enum: {
        values: [
          // Static QR Types
          "URL",
          "vCard",
          "Call",
          "WhatsApp",
          "WIFI",
          "Text",
          "Email",
          "SMS",
          // Dynamic QR Types
          "vCard Plus",
          "Dynamic URL",
          "PDF",
          "Landing page",
          "Images",
          "Video",
          "Social Media",
          "App Download",
          "Event",
          "Restaurant Menu",
          "Business Profile",
          "List of Links",
          "Product Catalogue",
          "Lead Form",
          "Google Review",
          "Resume QR Code",
        ],
      },
      message: `{VALUE} is not a valid QR Type!`,
    },

    qrState: {
      type: String,
      required: [true, "qrState is required"],
      enum: {
        values: ["static", "dynamic"],
        message: "{VALUE} is not a valid QR State!",
      },
      validate: {
        validator: function (v) {
          const allowedStates = ["static", "dynamic"];
          return allowedStates.includes(v);
        },
        message: (props) => `${props.value} is not an allowed QR state!`,
      },
      default: function () {
        const staticTypes = [
          "URL",
          "vCard",
          "Call",
          "WhatsApp",
          "WIFI",
          "Text",
          "Email",
          "SMS",
        ];
        return staticTypes.includes(this.qrType) ? "static" : "dynamic";
      },
    },

    // Charge information
    charge: {
      type: String,
      required: [true, "charge is required"],
      enum: {
        values: ["Free", "Paid"],
        message: "{VALUE} is not a valid Charge type!",
      },
      default: "Free",
    }, 

    // Section 2: Basic Information (flexible structure for different QR types)
    basicInfo: [{
      // URL QR
      website: {
        type: String,
        validate: {
          validator: function (v) {
            // Only validate if this is a URL type QR
            if (this.qrType === "URL" || this.qrType === "Dynamic URL") {
              return /^https?:\/\/.+/.test(v);
            }
            return true;
          },
          message: "Please enter a valid URL starting with http:// or https://",
        },
      },

      // vCard/vCard Plus
      firstName: { type: String },
      lastName: { type: String },
      organization: { type: String },
      title: { type: String },
      email: { type: String },
      phone: { type: String },
      mobile: { type: String },
      fax: { type: String },
      website: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
        country: { type: String },
      },

      // Call
      phoneNumber: { type: String },

      // WhatsApp
      whatsappNumber: { type: String },
      message: { type: String },

      // WIFI
      networkName: { type: String },
      password: { type: String },
      networkType: {
        type: String,
        enum: ["WPA", "WEP", "Open"],
      },

      // Text
      textContent: { type: String },

      // Email
      emailAddress: { type: String },
      subject: { type: String },
      body: { type: String },

      // SMS
      smsNumber: { type: String },
      smsMessage: { type: String },

      // PDF
      pdfUrl: { type: String },
      pdfTitle: { type: String },

      // Landing page
      pageTitle: { type: String },
      pageDescription: { type: String },
      pageContent: { type: String },

      // Images
      imageUrls: [{ type: String }],
      galleryTitle: { type: String },

      // Video
      videoUrls: [{ type: String }],
      videoTitle: { type: String },

      // Social Media
      socialLinks: [
        {
          platform: {
            type: String,
            enum: {
              values: [
                "facebook",
                "twitter",
                "instagram",
                "linkedin",
                "youtube",
                "tiktok",
              ],
              message: "{VALUE} is not a valid social media platform!",
            },
          },
          url: { type: String },
        },
      ],

      // App Download
      appName: { type: String },
      appDescription: { type: String },
      androidUrl: { type: String },
      iosUrl: { type: String },

      // Event
      eventName: { type: String },
      eventDescription: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      location: { type: String },

      // Restaurant Menu
      restaurantName: { type: String },
      menuItems: [
        {
          name: { type: String },
          description: { type: String },
          price: { type: Number },
          category: { type: String },
          image: { type: String },
        },
      ],

      // Business Profile
      businessName: { type: String },
      businessDescription: { type: String },
      businessHours: { type: String },
      businessAddress: { type: String },
      businessPhone: { type: String },
      businessEmail: { type: String },

      // List of Links
      links: [
        {
          title: { type: String },
          url: { type: String },
          description: { type: String },
        },
      ],

      // Product Catalogue
      products: [
        {
          name: { type: String },
          description: { type: String },
          price: { type: Number },
          image: { type: String },
          category: { type: String },
        },
      ],

      // Lead Form
      formFields: [
        {
          fieldName: { type: String },
          fieldType: {
            type: String,
            enum: ["text", "email", "phone", "textarea", "select"],
          },
          required: { type: Boolean, default: false },
          options: [{ type: String }], // for select fields
        },
      ],

      // Google Review
      businessGoogleId: { type: String },
      reviewPrompt: { type: String },

      // Resume QR Code
      resumeUrl: { type: String },
      candidateName: { type: String },
      position: { type: String },
    }],

    // Section 3: Configuration (only for dynamic QR)
    configuration: {
      redirectType: {
        type: String,
        enum: ["temporary", "permanent"],
        default: "temporary",
      },
      trackingEnabled: {
        type: Boolean,
        default: true,
      },
      passwordProtected: {
        type: Boolean,
        default: false,
      },
      password: { type: String },
      expirationDate: { type: Date },
      geofencing: {
        enabled: { type: Boolean, default: false },
        countries: [{ type: String }],
        cities: [{ type: String }],
      },
      deviceRestriction: {
        enabled: { type: Boolean, default: false },
        allowedDevices: [
          {
            type: String,
            enum: ["mobile", "tablet", "desktop"],
          },
        ],
      },
      timeRestriction: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String }, // HH:MM format
        endTime: { type: String }, // HH:MM format
        timezone: { type: String },
      },
    },

    // Section 4: Appearance (only for dynamic QR)
    appearance: {
      template: {
        type: String,
        enum: ["default", "modern", "classic", "minimal", "elegant"],
        default: "default",
      },
      colors: {
        primary: { type: String, default: "#000000" },
        secondary: { type: String, default: "#ffffff" },
        accent: { type: String, default: "#007bff" },
      },
      fonts: {
        heading: {
          type: String,
          enum: ["Arial", "Helvetica", "Times", "Georgia", "Verdana"],
          default: "Arial",
        },
        body: {
          type: String,
          enum: ["Arial", "Helvetica", "Times", "Georgia", "Verdana"],
          default: "Arial",
        },
      },
      customCSS: { type: String },
      backgroundImage: { type: String },
      layout: {
        type: String,
        enum: ["centered", "left", "right", "full-width"],
        default: "centered",
      },
    },

    // Section 5: Shape (same for all QR types)
    shape: {
      name: {
        type: String,
        enum: [
          "Default",
          "Circle",
          "Hexagon",
          "Shopping Cart",
          "Gift",
          "Message",
          "Cloud",
          "T-Shirt",
          "Truck",
          "Shopping Bag",
          "Tubelight",
        ],
        default: "Default",
      },
      
      type: {
        type: String,
        enum: ["free", "paid"],
        default: "free",
      },
      pointsCost: {
        type: Number,
        default: 0,
      },
      imageUrl: {
        type: String,
      },
    },
    
    // Section 6: Logo (same for all QR types)
    logo: {
      enabled: {
        type: Boolean,
        default: false,
      },
      imageUrl: { type: String },
      size: {
        type: Number,
        min: 10,
        max: 30,
        default: 20, // percentage of QR code size
      },
      shape: {
        type: String,
        enum: ["square", "rounded", "circular"],
        default: "square",
      },
      margin: {
        type: Number,
        min: 0,
        max: 10,
        default: 2,
      },
    },

    // Status and metadata
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "draft"],
      default: "active",
    },

    // Analytics data (for dynamic QRs)
    // analytics: {
    //   totalScans: {
    //     type: Number,
    //     default: 0
    //   },
    //   uniqueScans: {
    //     type: Number,
    //     default: 0
    //   },
    //   lastScanned: { type: Date },
    //   scanHistory: [{
    //     timestamp: { type: Date, default: Date.now },
    //     location: {
    //       country: { type: String },
    //       city: { type: String },
    //       coordinates: {
    //         lat: { type: Number },
    //         lng: { type: Number }
    //       }
    //     },
    //     device: {
    //       type: { type: String },
    //       os: { type: String },
    //       browser: { type: String }
    //     },
    //     ip: { type: String }
    //   }]
    // },

    // User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Generated QR data
    // qrData: {
    //   type: String // The actual data encoded in the QR
    // },

    qrImageUrl: {
      type: String, // URL to the generated QR image
    },

    // websiteUrl: {
    //   type: String, 
    //   required: true,
    // },
    // Dynamic QR specific fields
    shortUrl: {
      type: String,
      unique: true,
      sparse: true, // Only for dynamic QRs
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Indexes for better performance
qrCodeSchema.index({ userId: 1, qrType: 1 });
qrCodeSchema.index({ shortUrl: 1 });
qrCodeSchema.index({ status: 1 });
qrCodeSchema.index({ createdAt: -1 });

// Virtual for getting scan rate
qrCodeSchema.virtual("scanRate").get(function () {
  if (!this.analytics.totalScans || !this.createdAt) return 0;
  const daysSinceCreation =
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation > 0
    ? (this.analytics.totalScans / daysSinceCreation).toFixed(2)
    : 0;
});



// Pre-save middleware to set qrState based on qrType
qrCodeSchema.pre("save", function (next) {
  const staticTypes = [
    "URL",
    "vCard",
    "Call",
    "WhatsApp",
    "WIFI",
    "Text",
    "Email",
    "SMS",
  ];

  if (staticTypes.includes(this.qrType)) {
    this.qrState = "static";
    // Clear dynamic-only fields for static QRs
    this.configuration = undefined;
    this.appearance = undefined;
    this.shortUrl = undefined;
  } else {
    this.qrState = "dynamic";
  }

  next();
});



// Method to increment scan count
qrCodeSchema.methods.recordScan = function (scanData = {}) {
  this.analytics.totalScans += 1;
  this.analytics.lastScanned = new Date();

  // Add to scan history
  this.analytics.scanHistory.push({
    timestamp: new Date(),
    location: scanData.location || {},
    device: scanData.device || {},
    ip: scanData.ip || "",
  });

  // Keep only last 1000 scan records to prevent excessive growth
  if (this.analytics.scanHistory.length > 1000) {
    this.analytics.scanHistory = this.analytics.scanHistory.slice(-1000);
  }

  return this.save();
};

// Method to check if QR is expired
qrCodeSchema.methods.isExpired = function () {
  if (this.configuration && this.configuration.expirationDate) {
    return new Date() > this.configuration.expirationDate;
  }
  return false;
};

// Method to validate basic info based on QR type
qrCodeSchema.methods.validateBasicInfo = function () {
  const requiredFields = {
    URL: ["website"],
    vCard: ["firstName", "lastName"],
    Call: ["phoneNumber"],
    WhatsApp: ["whatsappNumber"],
    WIFI: ["networkName", "networkType"],
    Text: ["textContent"],
    Email: ["emailAddress"],
    SMS: ["smsNumber"],
    "vCard Plus": ["firstName", "lastName", "email"],
    "Dynamic URL": ["website"],
    PDF: ["pdfUrl", "pdfTitle"],
    "Landing page": ["pageTitle", "pageContent"],
    Images: ["imageUrls"],
    Video: ["videoUrls"],
    "Social Media": ["socialLinks"],
    "App Download": ["appName", "androidUrl"],
    Event: ["eventName", "startDate"],
    "Restaurant Menu": ["restaurantName", "menuItems"],
    "Business Profile": ["businessName", "businessDescription"],
    "List of Links": ["links"],
    "Product Catalogue": ["products"],
    "Lead Form": ["formFields"],
    "Google Review": ["businessGoogleId"],
    "Resume QR Code": ["resumeUrl", "candidateName"],
  };

  const required = requiredFields[this.qrType] || [];
  const missing = required.filter((field) => {
    const value = this.basicInfo[field];
    return !value || (Array.isArray(value) && value.length === 0);
  });

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
};

// Static method to get QR types by category
qrCodeSchema.statics.getQRTypesByCategory = function () {
  return {
    static: [
      "URL",
      "vCard",
      "Call",
      "WhatsApp",
      "WIFI",
      "Text",
      "Email",
      "SMS",
    ],
    dynamic: [
      "vCard Plus",
      "Dynamic URL",
      "PDF",
      "Landing page",
      "Images",
      "Video",
      "Social Media",
      "App Download",
      "Event",
      "Restaurant Menu",
      "Business Profile",
      "List of Links",
      "Product Catalogue",
      "Lead Form",
      "Google Review",
      "Resume QR Code",
    ],
  };
};

// Export the model
const QrModel = mongoose.model("QRCode", qrCodeSchema);
export default QrModel;
