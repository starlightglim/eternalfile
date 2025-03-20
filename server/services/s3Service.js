const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

let s3;

const initialize = () => {
  // Skip S3 initialization if using local storage
  if (process.env.STORAGE_TYPE === 'local') {
    console.log('Using local storage instead of S3');
    return;
  }

  // Initialize S3 client
  try {
    s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    console.log('AWS S3 client initialized');
  } catch (error) {
    console.error('Failed to initialize S3 client:', error);
  }
};

const uploadFile = async (file, key) => {
  // Use local storage if S3 is not initialized
  if (!s3 || process.env.STORAGE_TYPE === 'local') {
    return saveToLocal(file, key);
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    // Fallback to local storage
    return saveToLocal(file, key);
  }
};

const saveToLocal = (file, key) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, key);
  const fileStream = fs.createReadStream(file.path);
  const writeStream = fs.createWriteStream(filePath);
  
  return new Promise((resolve, reject) => {
    fileStream.pipe(writeStream)
      .on('finish', () => {
        resolve(`/uploads/${key}`);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

// Upload a buffer to S3 directly
const uploadBuffer = async (buffer, key, contentType) => {
  const s3Client = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
  }
  
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  };
  
  try {
    const data = await s3Client.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error('Error uploading buffer to S3:', error);
    throw new Error(`Failed to upload buffer to S3: ${error.message}`);
  }
};

// Delete a file from S3
const deleteFile = async (key) => {
  const s3Client = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
  }
  
  const params = {
    Bucket: bucketName,
    Key: key
  };
  
  try {
    await s3Client.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

// Upload an image and create a thumbnail
const uploadImageWithThumbnail = async (filePath, fileName, mimeType) => {
  const s3Client = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const imageKey = `images/original/${fileName}`;
  const thumbnailKey = `images/thumbnails/${fileName}`;
  
  // Get image metadata
  const metadata = await sharp(filePath).metadata();
  
  // Create thumbnail buffer
  const thumbnailBuffer = await sharp(filePath)
    .resize(300, 300, { fit: 'inside' })
    .toBuffer();
  
  // Upload original image
  const imageUrl = await uploadFile(filePath, imageKey, mimeType);
  
  // Upload thumbnail
  const thumbnailUrl = await uploadBuffer(thumbnailBuffer, thumbnailKey, 'image/jpeg');
  
  return {
    imageUrl,
    thumbnailUrl,
    metadata
  };
};

// Extract key from S3 URL
const getKeyFromUrl = (url) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Handle different S3 URL formats
  if (url.includes(`${bucketName}.s3.${region}.amazonaws.com`)) {
    return url.split(`${bucketName}.s3.${region}.amazonaws.com/`)[1];
  } else if (url.includes(`s3.${region}.amazonaws.com/${bucketName}/`)) {
    return url.split(`s3.${region}.amazonaws.com/${bucketName}/`)[1];
  } else if (url.includes(`${bucketName}.s3.amazonaws.com`)) {
    return url.split(`${bucketName}.s3.amazonaws.com/`)[1];
  }
  
  // If we can't parse the URL, return the full URL as a fallback
  console.warn(`Could not extract key from URL: ${url}`);
  return url;
};

module.exports = {
  initialize,
  uploadFile,
  uploadBuffer,
  deleteFile,
  uploadImageWithThumbnail,
  getKeyFromUrl
}; 