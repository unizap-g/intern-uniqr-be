// routes/qrRoutes.js
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js'                               
import { 
    getShapes,
    getQrCodeById, 
    updateQrCode, 
    deleteQrCode, 
    duplicateQrCode, 
    createQR,
    getAllQR
} from '../controllers/qrCodeController.js';

const router = express.Router();

/**
 * @route   GET /api/qr/shapes
 * @desc    Get available QR code shapes
 * @access  Public (or can be made private by adding authenticate middleware)
 */
router.get('/shapes', getShapes);

//CHECKING CREATE ENDPOINT
router.post('/create', createQR)
router.post('/qr-list', getAllQR)

/**
 * @route   GET /api/qr/qrcode/edit/:id
 * @desc    Get QR code by ID for editing
 * @access  Private (requires authentication)
 */
router.get('/qrcode/edit/:id', authenticate, getQrCodeById);

/**
 * @route   PATCH /api/qr/qrcode/:id
 * @desc    Update QR code by ID
 * @access  Private (requires authentication)
 */
router.patch('/qrcode/:id', authenticate, updateQrCode);

/**
 * @route   DELETE /api/qr/qrcode/:id
 * @desc    Delete QR code by ID
 * @access  Private (requires authentication)
 */
router.delete('/qrcode/:id', authenticate, deleteQrCode);

/**
 * @route   POST /api/qr/qrcode/:id/duplicate
 * @desc    Duplicate QR code by ID
 * @access  Private (requires authentication)
 */
router.post('/qrcode/:id/duplicate', authenticate, duplicateQrCode);

export default router;