const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3.config');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadProfilePhoto = async (file) => {
    if (!file) return null;

    const fileExtension = path.extname(file.originalname);
    const fileName = `profiles/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Generate the public URL
    const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return {
        url: publicUrl,
        key: fileName
    };
};

module.exports = {
    uploadProfilePhoto
};
