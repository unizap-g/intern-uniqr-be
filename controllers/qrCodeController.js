// controllers/qrCodeController.js
import { ObjectId } from 'mongodb';
import { getQrCodesCollection } from '../config/database.js';
import QrModel from '../models/qrModel.js';
// GET /api/qr/shapes
export const getShapes = (req, res) => {
    const shapes = [
        { name: 'Default', type: 'free', pointsCost: 0, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Default' },
        { name: 'Circle', type: 'free', pointsCost: 0, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Circle' },
        { name: 'Cloud', type: 'free', pointsCost: 0, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Cloud' },
        { name: 'Gift', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Gift' },
        { name: 'Shopping Cart', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Cart' },
        { name: 'Package', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Package' },
        { name: 'T-Shirt', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=T-Shirt' },
        { name: 'House', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=House' },
        { name: 'Shopping Bag', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Bag' },
        { name: 'Electronics', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Gadget' },
        { name: 'Present', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Present' },
        { name: 'Tubelight', type: 'paid', pointsCost: 10, imageUrl: 'https://placehold.co/100x100/eeeeee/31343C?text=Tubelight' },
    ];
    res.status(200).json(shapes);
};

//GET 
export const createQR = async (req, res) => {
  try {
    console.log("hello")
    console.log(req.body);
    const { qrType, qrName, basicInfo } = req.body;
    // --- Call QR Engine (simulate QR creation) ---
    console.log(qrType, qrName, basicInfo);
    
    const qrEngineUrl = `http://10.1.4.19:5001/generate`;
    // Save into MongoDB
    const qr = await QrModel.create({
      qrType,
      qrName,
      basicInfo,
      qrShow: {
        title: qrName,
        link: basicInfo?.website,
        scans: 0,
        status: 'active'
      },
      qrImageUrl: qrEngineUrl
    });
    res.status(201).json(qr);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// get qr list

export const getAllQR = async (req, res) => {
  try {
    const qrs = await QrModel.find().sort({ createdAt: -1 });
    const formatted = qrs.map(qr => ({
      _id: qr._id,
      qrType: qr.qrType,
      title: qr.qrShow?.title || qr.qrName || "Untitled",
      link: qr.qrShow?.link || qr.basicInfo?.website || '',
      scans: qr.qrShow?.scans ?? qr.analytics?.totalScans ?? 0,
      status: qr.qrShow?.status || qr.status || qr.qrState,
      createdAt: qr.createdAt,
      qrImageUrl: qr.qrImageUrl  // this is key for displaying the QR code
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching QR codes', error });
  }
};







// GET /api/qr/qrcode/edit/:id
export const getQrCodeById = async (req, res) => {
    const qrCodesCollection =await getQrCodesCollection();
    const { id } = req.params;
    console.log("id from getQrCode:",id);
    const userId = req.user?.id; // Get user ID from authentication middleware

    console.log("userId from getQrcode:",userId);
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid QR Code ID format." });
    }

    try {
        const query = { _id: new ObjectId(id), userId: userId };
        const qrCode = await qrCodesCollection.findOne(query);

        if (!qrCode) {
            return res.status(200).json({ message: "QR Code not found!" });
        }
        res.status(200).json(qrCode);
    } catch (error) {
        console.error("Error fetching QR code:", error);
        res.status(500).json({ message: "An error occurred while fetching the QR code." });
    }
};

// PATCH /api/qr/qrcode/:id
export const updateQrCode = async (req, res) => {
    const qrCodesCollection = getQrCodesCollection();
    const { id } = req.params;
    const userId = req.user?.id; // Get user ID from authentication middleware
    const updatedData = req.body;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid QR Code ID format." });
    }
    
    // Remove fields that should not be updated directly by the client
    delete updatedData._id;
    delete updatedData.userId; 
    delete updatedData.createdAt;

    try {
        const query = { _id: new ObjectId(id), userId: userId };

        const updateDoc = {
            $set: {
                ...updatedData,
                updatedAt: new Date() // Always update the timestamp
            }
        };

        const result = await qrCodesCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "QR Code not found or you do not have permission to edit it." });
        }
        
        const updatedQrCode = await qrCodesCollection.findOne(query);
        res.status(200).json(updatedQrCode);

    } catch (error) {
        console.error("Error updating QR code:", error);
        res.status(500).json({ message: "An error occurred while updating the QR code." });
    }
};

// DELETE /api/qr/qrcode/:id
export const deleteQrCode = async (req, res) => {
    const qrCodesCollection = getQrCodesCollection();
    const { id } = req.params;
    const userId = req.user?.id; // Get user ID from authentication middleware

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid QR Code ID format." });
    }

    try {
        const query = { _id: new ObjectId(id), userId: userId };
        const result = await qrCodesCollection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "QR Code not found or you do not have permission to delete it." });
        }
        res.status(200).json({ message: "QR Code deleted successfully." });
    } catch (error) {
        console.error("Error deleting QR code:", error);
        res.status(500).json({ message: "An error occurred while deleting the QR code." });
    }
};

// POST /api/qr/qrcode/:id/duplicate
export const duplicateQrCode = async (req, res) => {
    const qrCodesCollection = getQrCodesCollection();
    const { id } = req.params;
    const userId = req.user?.id; // Get user ID from authentication middleware

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid QR Code ID format." });
    }

    try {
        const originalQrCode = await qrCodesCollection.findOne({ _id: new ObjectId(id), userId: userId });
        if (!originalQrCode) {
            return res.status(404).json({ message: "Original QR Code not found or you do not have permission to duplicate it." });
        }
        
        const baseName = originalQrCode.qrName.replace(/\(\d+\)$/, '').trim();
        const searchRegex = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\(\\d+\\))?$`);
        const existingCopies = await qrCodesCollection.find({ userId: userId, qrName: searchRegex }).toArray();

        let highestNumber = 0;
        existingCopies.forEach(doc => {
            const match = doc.qrName.match(/\((\d+)\)$/);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > highestNumber) {
                    highestNumber = num;
                }
            }
        });

        const newQrName =`${baseName}(${highestNumber + 1})`;

        const duplicatedQrCode = { ...originalQrCode };
        delete duplicatedQrCode._id;
        duplicatedQrCode.qrName = newQrName;
        duplicatedQrCode.createdAt = new Date();
        duplicatedQrCode.updatedAt = new Date();
        duplicatedQrCode.scanCount = 0;

        const result = await qrCodesCollection.insertOne(duplicatedQrCode);
        const newQrCode = await qrCodesCollection.findOne({ _id: result.insertedId });
        res.status(201).json(newQrCode);

    } catch (error) {
        console.error("Error duplicating QR code:", error);
        res.status(500).json({ message: "An error occurred while duplicating the QR code." });
    }
};

export default {
    getShapes,
    getQrCodeById,
    updateQrCode,
    deleteQrCode,
    duplicateQrCode
};