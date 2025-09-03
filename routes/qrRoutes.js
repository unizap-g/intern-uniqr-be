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
    getAllQR,
    saveQr,
    getLogo,
    getShape
} from '../controllers/qrCodeController.js';

const router = express.Router();

/**
 * @route   GET /api/qr/shapes
 * @desc    Get available QR code shapes
 * @access  Public (or can be made private by adding authenticate middleware)
 */
router.get('/shapes', getShapes);

//CHECKING CREATE ENDPOINT
router.post('/createQr',  createQR)
router.post('/saveQr', saveQr)
router.get('/qr-list', getAllQR)

/**
 * @route   GET /api/qr/qrcode/edit/:id
 * @desc    Get QR code by ID for editing
 * @access  Private (requires authentication)
 */
router.get('/qrcode/edit/:id', getQrCodeById);

/**
 * @route   PATCH /api/qr/qrcode/:id
 * @desc    Update QR code by ID
 * @access  Private (requires authentication)
 */
router.patch('/qrcode/:id', updateQrCode);

/**
 * @route   DELETE /api/qr/qrcode/:id
 * @desc    Delete QR code by ID
 * @access  Private (requires authentication)
 */
router.delete('/qrcode/:id', deleteQrCode);

/**
 * @route   POST /api/qr/qrcode/:id/duplicate
 * @desc    Duplicate QR code by ID
 * @access  Private (requires authentication)
 */
router.post('/qrcode/:id/duplicate', duplicateQrCode);


// get logo
router.get('/getlogo', getLogo);
// get shape
router.get('/getshape', getShape);
export default router;