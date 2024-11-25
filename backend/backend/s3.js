// backend/s3.js
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // your AWS access key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // your AWS secret key
  region: process.env.AWS_REGION, // your AWS region
});

const s3 = new AWS.S3();

module.exports = s3;
