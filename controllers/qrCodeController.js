import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { getQrCodesCollection } from "../config/database.js";
import QrModel from "../models/qrModel.js";
import axios from "axios";
import User from "../models/userModel.js";
import shape from "../models/shapeModel.js";
import logo from "../models/logoModel.js";





// DELETE QR by id
export const deleteQrCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    // const userId = req.user?.id;
    const {userId} = req.body;
    // if (!userId) {
    //   return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    // }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid QR Code ID format." });
    }
    const result = await QrModel.deleteOne({ _id: id, userId: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "QR Code not found or you do not have permission to delete it." });
    }
    res.status(200).json({ success: true, message: "QR Code deleted successfully." });
  } catch (error) {
    console.error("Error deleting QR code:", error);
    res.status(500).json({ message: "An error occurred while deleting the QR code." });
  }
};


export const uploadLogoCustom = async (req, res) => {
  try {
    // check multer file
    console.log("File received:", req.file);
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // upload to cloudinary
    const uploadedUrl = await uploadOnCloudinary(req.file.path);
    if (!uploadedUrl) {
      return res.status(500).json({ message: "Failed to upload to Cloudinary" });
    }
console.log("File received:", req.file);

    // save in DB
    const newLogo = await logo.create({
      logoUrl: uploadedUrl,
      image: req.file.originalname,
    });

    res.status(201).json({
      message: "Custom logo uploaded successfully",
      logo: newLogo,
    });
  } catch (error) {
    console.error("Error uploading custom logo:", error);
    res.status(500).json({ message: "Error uploading custom logo", error });
  }
};

// get custom logos
// controllers/logoController.js

// ✅ Get all logos
export const getCustomLogos = async (req, res) => {
  try {
    const logos = await logo.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(logos);
  } catch (error) {
    console.error("Error fetching logos:", error);
    res.status(500).json({ message: "Error fetching logos", error });
  }
};
// controllers/qrCodeController.js

// GET /api/qr/shapes


//POST   createQr
export const createQR = async (req, res) => {
  try {


    const userId = req.user?.id; // Get user ID from authentication middleware
    const {
      QRType,
      QRState,
      QRName,
      Charge,
      BasicInfo,
      Configuration,
      Appearance,
      Shape,
      Logo,
      Status,
      CreatedAt,
      UpdatedAt,
    } = req.body;
    
    console.log(BasicInfo, "asdfhsd");
    // ENUMS from your model
    const qrTypeEnum = [
      "URL",
      "vCard",
      "Call",
      "WhatsApp",
      "WIFI",
      "Text",
      "Email",
      "SMS",
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
    ];
    const qrStateEnum = ["static", "dynamic"];
    const chargeEnum = ["Free", "Paid"];

    // Validation
    const errors = [];
    if (!QRName || typeof QRName !== "string" || QRName.trim().length === 0) {
      errors.push("qrName is required and must be a non-empty string.");
    }
    if (!QRType || !qrTypeEnum.includes(QRType)) {
      errors.push(`qrType must be one of: ${qrTypeEnum.join(", ")}`);
    }
    if (!QRState || !qrStateEnum.includes(QRState)) {
      errors.push(`qrState must be one of: ${qrStateEnum.join(", ")}`);
    }
    if (!Charge || !chargeEnum.includes(Charge)) {
      errors.push(`charge must be one of: ${chargeEnum.join(", ")}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors });
    }

    const payload = {
      QRType,
      QRState,
      QRName,
      Charge,
      BasicInfo,
      Configuration,
      Appearance,
      Shape,
      Logo,
      Status,
      CreatedAt,
      UpdatedAt,
    };

    // --- Call QR Engine (simulate QR creation) ---

    const qrEngineUrl = process.env.ENGINE_URL;

    const response = await axios.post(`${qrEngineUrl}`, payload);


    // console.log(':white_check_mark: QR code created successfully:', qr);
    res.status(200).json({
      ...response.data,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

//POST save qr in user's DB
export const saveQr = async (req, res) => {
  try {
    const userId = req.user?.id;
    const responseData = req.body;
    console.log("saveQr request body    dsvfvfgbdgghngfvdfbvfgbfgbf  :", responseData);

    const qr = await QrModel.create({
      qrType: responseData.QRType,
      qrState: responseData.QRState,
      qrName: responseData.QRName,
      charge: responseData.Charge,
      basicInfo: responseData.BasicInfo,
      // websiteUrl: responseData.websiteUrl,
      configuration: responseData.Configuration,
      appearance: responseData.Appearance,
      shape: responseData.Shape,
      logo: responseData.Logo,
      status: responseData.Status,
      createdAt: responseData.CreatedAt || new Date(),
      updatedAt: responseData.UpdatedAt || new Date(),
      qrShow: {
        title: responseData.QRName,
        link: responseData.BasicInfo?.[0]?.website,
        scans: 0,
        status: responseData.Status,
      },

      qrImageUrl: responseData.img,
      qrImageName: responseData.img,
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Store QR id in user's collection using userId from authenticate middleware
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { allQr: { qrlist: qr._id } } },
      { new: true }
    );
    console.log(user);
    res.status(201).json({ success: true, qrId: qr._id, qr, user });
  } catch (error) {
    console.log(error);
    console.error("Error saving QR code:", error);
    res.status(500).json({ error });
  }
};


// get shape
export const getShape = async (req, res) => {
  try {
    const shapes = await shape.find();
    console.log(shapes, "shapes");
    res.status(200).json(shapes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shapes', error });
  }
};

// get logo
export const getLogo = async (req, res) => {
  try {
    const logos = await logo.find();
    res.status(200).json(logos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logos', error });
  }
};

// get qr list
export const getAllQR = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    // Populate allQr.qrlist to get full QR code documents
    const user = await User.findById(userId).populate('allQr.qrlist');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const qrList = user.allQr.map(q => q.qrlist);
    res.status(200).json({ qrList });
  } catch (err) {
    res.status(500).json({ message: "Error fetching QR codes", error: err });
  }
}


// GET /api/qr/qrcode/edit/:id
export const getQrCodeById = async (req, res) => {
  const { QrId } = req.params;
   const userId = req.user?.id;
  console.log("id from getQrCode:", QrId);
//   const userId = req.user?.id; // Get user ID from authentication middleware
  try {
    const qrCode = await QrModel.findById({_id:QrId, userId:userId});

    if(!qrCode) {
      return res.status(200).json({ message: "QR Code not found!" });
    }
    res.status(200).json(qrCode);
  } catch (error) {
    console.error("Error fetching QR code:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the QR code." });
  }
};

// PATCH /api/qr/qrcode/:id
// export const updateQrCode = async (req, res) => {
//   const qrCodesCollection = getQrCodesCollection();
//   const { id } = req.params;
// //   const userId = req.user?.id; // Get user ID from authentication middleware
//   //const qrId = req.body.qrId; // Get user ID from authentication middleware
//   //const  updatedData  = req.body;
//   const{userID, ...updateData}=req.body;

//   // if (!userId) {
//   //     return res.status(401).json({ message: "Unauthorized: User not authenticated." });
//   // }
//   // if (!ObjectId.isValid(id)) {
//   //     return res.status(400).json({ message: "Invalid QR Code ID format." });
//   // }

//   // Remove fields that should not be updated directly by the client
//   delete updatedData._id;
//   delete updatedData.userId;
//   delete updatedData.createdAt;

//   try {
//     const qrCode = await QrModel.findById({_id:qrId});

//     if (!qrCode) {
//       return res.status(200).json({ message: "QR Code not found!" });
//     }
    
//     const query = { _id: new ObjectId(id), userId: userId };

//     const updateDoc = {
//       $set: {
//         ...updatedData,
//         updatedAt: new Date(), // Always update the timestamp
//       },
//     };
//     res.status(200).json(qrCode);
//     const result = await qrCodesCollection.updateOne(query, updateDoc);

//     if (result.matchedCount === 0) {
//       return res
//         .status(404)
//         .json({
//           message:
//             "QR Code not found or you do not have permission to edit it.",
//         });
//     }

//     const updatedQrCode = await qrCodesCollection.findOne(query);
//     res.status(200).json(updatedQrCode);
//   } catch (error) {
//     console.error("Error updating QR code:", error);
//     res
//       .status(500)
//       .json({ message: "An error occurred while updating the QR code." });
//   }
// };
// export const updateQrCode = async (req, res) => {
//   try {
//     // const { id } = req.params;
//     const {userId} = req.body;
//     // const userId = req.user?.id;
//     const updateData = { ...req.body };

//     // Remove fields that should not be updated directly by the client
//     delete updateData._id;
//     delete updateData.userId;
//     delete updateData.createdAt;

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized: User not authenticated." });
//     }
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid QR Code ID format." });
//     }

//     // Only allow update if QR belongs to the user
//     const qrCode = await QrModel.findOneAndUpdate(
//       { _id: id, userId: userId },
//       { ...updateData, updatedAt: new Date() },
//       { new: true, runValidators: true }
//     );

//     if (!qrCode) {
//       return res.status(404).json({ message: "QR Code not found or you do not have permission to edit it." });
//     }

//     res.status(200).json(qrCode);
//   } catch (error) {
//     console.error("Error updating QR code:", error);
//     res.status(500).json({ message: "An error occurred while updating the QR code." });
//   }
// };
export const updateQrCode = async (req, res) => {
  try {
    const { QrId } = req.params;
     const userId = req.user?.id;
    const { ...updatedData } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(QrId)) {
      return res.status(400).json({ message: "Invalid QR Code ID format." });
    }
    // Remove fields that should not be updated directly by the client
    delete updatedData._id;
    delete updatedData.createdAt;
    // Only allow update if QR belongs to the user
    const qrCode = await QrModel.findOneAndUpdate(
      { _id: QrId, userId: userId },
      { ...updatedData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    console.log(qrCode);
    if (!qrCode) {
      return res.status(404).json({ message: "QR Code not found or you do not have permission to edit it." });
    }
    res.status(200).json(qrCode);
  } catch (error) {
    res.status(500).json({ message: "An error occurred while updating the QR code.", error });
  }
};


// DELETE /api/qr/qrcode/:id
export const deleteQrCode = async (req, res) => {
  try {
    const { QrId } = req.params;
     const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(QrId)) {
      return res.status(400).json({ message: "Invalid QR Code ID format." });
    }
    // Remove reference from user's allQr array
    await User.findByIdAndUpdate(userId, { $pull: { allQr: { qrlist: QrId } } });
    // Delete QR code document
    const result = await QrModel.deleteOne({ _id: QrId, userId: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "QR Code not found or you do not have permission to delete it." });
    }
    res.status(200).json({ success: true, message: "QR Code deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while deleting the QR code.", error });
  }
};


// POST /api/qr/qrcode/:id/duplicate
// export const duplicateQrCode = async (req, res) => {
//   const qrCodesCollection = getQrCodesCollection();
//   const { id } = req.params;
//   const userId = req.user?.id; // Get user ID from authentication middleware

//   if (!userId) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: User not authenticated." });
//   }
//   if (!ObjectId.isValid(id)) {
//     return res.status(400).json({ message: "Invalid QR Code ID format." });
//   }

//   try {
//     const originalQrCode = await qrCodesCollection.findOne({
//       _id: new ObjectId(id),
//       userId: userId,
//     });
//     if (!originalQrCode) {
//       return res
//         .status(404)
//         .json({
//           message:
//             "Original QR Code not found or you do not have permission to duplicate it.",
//         });
//     }

//     const baseName = originalQrCode.qrName.replace(/\(\d+\)$/, "").trim();
//     const searchRegex = new RegExp(
//       `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\(\\d+\\))?$`
//     );
//     const existingCopies = await qrCodesCollection
//       .find({ userId: userId, qrName: searchRegex })
//       .toArray();

//     let highestNumber = 0;
//     existingCopies.forEach((doc) => {
//       const match = doc.qrName.match(/\((\d+)\)$/);
//       if (match && match[1]) {
//         const num = parseInt(match[1], 10);
//         if (num > highestNumber) {
//           highestNumber = num;
//         }
//       }
//     });

//     const newQrName = `${baseName}(${highestNumber + 1})`;

//     const duplicatedQrCode = { ...originalQrCode };
//     delete duplicatedQrCode._id;
//     duplicatedQrCode.qrName = newQrName;
//     duplicatedQrCode.createdAt = new Date();
//     duplicatedQrCode.updatedAt = new Date();
//     duplicatedQrCode.scanCount = 0;

//     const result = await qrCodesCollection.insertOne(duplicatedQrCode);
//     const newQrCode = await qrCodesCollection.findOne({
//       _id: result.insertedId,
//     });
//     res.status(201).json(newQrCode);
//   } catch (error) {
//     console.error("Error duplicating QR code:", error);
//     res
//       .status(500)
//       .json({ message: "An error occurred while duplicating the QR code." });
//   }
// };
export const duplicateQrCode = async (req, res) => {
  try {
    const { QrId } = req.params;
   const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(QrId)) {
      return res.status(400).json({ message: "Invalid QR Code ID format." });
    }
    const originalQrCode = await QrModel.findOne({ _id: QrId, userId: userId });
    if (!originalQrCode) {
      return res.status(404).json({ message: "Original QR Code not found or you do not have permission to duplicate it." });
    }
    // Generate new name with "Copy of" prefix
    let newQrName = originalQrCode.qrName.startsWith('Copy of ')
      ? `Copy of ${originalQrCode.qrName}`
      : `Copy of ${originalQrCode.qrName}`;
    // Ensure unique name
    let finalName = newQrName;
    let nameExists = await QrModel.findOne({ userId: userId, qrName: finalName });
    while (nameExists) {
      finalName = `Copy of ${finalName}`;
      nameExists = await QrModel.findOne({ userId: userId, qrName: finalName });
    }
    // Create new QR code data
    const duplicatedData = originalQrCode.toObject();
    delete duplicatedData._id;
    duplicatedData.qrName = finalName;
    duplicatedData.createdAt = new Date();
    duplicatedData.updatedAt = new Date();
    duplicatedData.scanCount = 0;
    const newQrCode = await QrModel.create(duplicatedData);
    // Add reference to user's allQr array
    await User.findByIdAndUpdate(userId, { $push: { allQr: { qrlist: newQrCode._id } } });
    res.status(201).json(newQrCode);
  } catch (error) {
    res.status(500).json({ message: "An error occurred while duplicating the QR code.", error });
  }
};

export default {
  getQrCodeById,
  updateQrCode,
  deleteQrCode,
  duplicateQrCode,
};
