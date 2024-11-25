const express = require('express');
const router = express.Router();
const s3 = require('../s3');
const sizeOf = require('image-size'); // Import the image-size library

// Endpoint: List images with damage information based on ReferenceNo
router.get('/images/:referenceNo', async (req, res) => {
  const { referenceNo } = req.params;

  try {
    // List all image files in the S3 images directory for the reference number
    const imageParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: `AIInspection/${referenceNo}/images/`,
    };

    const coordinateParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: `AIInspection/${referenceNo}/coordinates/`,
    };

    // Fetch image files
    const imageData = await s3.listObjectsV2(imageParams).promise();
    if (!imageData.Contents || imageData.Contents.length === 0) {
      return res.status(404).json({ message: 'No images found for this reference number' });
    }

    // Fetch coordinate files
    const coordinateData = await s3.listObjectsV2(coordinateParams).promise();

    // Parse coordinate files
    const coordinateFiles = {};
    for (const coord of coordinateData.Contents) {
      const key = coord.Key;
      const fileName = key.split('/').pop().replace('.txt', ''); // Extract file name
      try {
        const fileContent = await s3.getObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }).promise();
        coordinateFiles[fileName] = parseDamageReport(fileContent.Body.toString('utf-8'));
      } catch (error) {
        console.warn(`Error reading coordinates for file: ${key}`);
        coordinateFiles[fileName] = []; // No coordinates if file is missing or unreadable
      }
    }

    // Helper function to check if a key corresponds to an image file
    function isImageFile(key) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
      return imageExtensions.some((ext) => key.toLowerCase().endsWith(ext));
    }

    // Combine images and their respective damage info
    const imagePromises = imageData.Contents
      .filter((item) => {
        // Exclude directories and non-image files
        const key = item.Key;
        const isNotDirectory = !key.endsWith('/');
        const isImage = isImageFile(key);
        return isNotDirectory && isImage;
      })
      .map(async (item) => {
        const imageKey = item.Key;
        const imageName = imageKey.split('/').pop().replace(/\.[^/.]+$/, ''); // Remove extension to match with coordinate files

        // Get signed URL
        const url = s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: imageKey,
          Expires: 3600, // URL valid for 1 hour
        });

        // Get image dimensions
        const imageObject = await s3.getObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: imageKey }).promise();

        if (!imageObject.Body) {
          console.error(`Image body is empty for key: ${imageKey}`);
          return null; // Skip this image
        }

        const dimensions = sizeOf(imageObject.Body);

        return {
          ReferenceNo: referenceNo,
          imageName: imageKey.split('/').pop(), // Full image name
          imageUrl: url,
          imageDimensions: {
            width: dimensions.width,
            height: dimensions.height,
          },
          damageInfo: coordinateFiles[imageName] || [], // Match coordinates with image name
        };
      });

    const imagesWithDamageInfo = (await Promise.all(imagePromises)).filter((img) => img !== null);

    res.json(imagesWithDamageInfo);
  } catch (error) {
    console.error('Error fetching images and damage info:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to parse the txt content
function parseDamageReport(txtContent) {
  const lines = txtContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0); // Filter out empty lines

  return lines
    .map((line) => {
      try {
        const [type, coords] = line.split(' '); // Split the line into type and coordinates

        if (!type || !coords) {
          throw new Error('Invalid line format');
        }

        const [x, y, x2, y2] = coords.split(',').map(Number);

        // Validate parsed values
        if ([type, x, y, x2, y2].some((value) => isNaN(value))) {
          console.error(`Invalid coordinates in line: "${line}"`);
          return null; // Return null to filter out invalid entries later
        }

        return {
          repairReplace: type === '1' ? 'Repair' : 'Replace',
          coordinates: {
            x,
            y,
            width: x2 - x, // Calculate width
            height: y2 - y, // Calculate height
          },
        };
      } catch (error) {
        console.error(`Error parsing line: "${line}"`, error);
        return null; // Return null to filter out invalid entries later
      }
    })
    .filter((entry) => entry !== null); // Remove null entries
}

module.exports = router;
