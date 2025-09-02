// config/database.js
import mongoose from 'mongoose';

// Get QR Codes collection
export const getQrCodesCollection = async() => {
    // // console.log(mongoose.connect.db.collection('qrcodes'));
    // const qrCode = await mongoose.connection.db.collection('qrcodes');
    // return qrCode;

     if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
    }
    return mongoose.connection.db.collection('qrcodes');
};

export default {
    getQrCodesCollection
};