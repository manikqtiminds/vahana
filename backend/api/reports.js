// backend/api/reports.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Endpoint: Get all images and reports for a ReferenceNo
router.get('/:referenceNo', async (req, res) => {
  const { referenceNo } = req.params;

  try {
    const pool = await poolPromise;

    // Fetch images from MLImageAssessment based on ReferenceNo
    const imagesResult = await pool.request()
      .input('referenceNo', sql.NVarChar, referenceNo)
      .query(`
        SELECT MLImageAssessmentId, ReferenceNo, S3AssessedImageUrl, Status
        FROM MLImageAssessment
        WHERE ReferenceNo = @referenceNo
      `);

    const images = imagesResult.recordset;

    if (!images || images.length === 0) {
      return res.status(404).json({ message: 'No images found for this reference number' });
    }

    // For each image, fetch damage assessments
    const imagesWithReports = await Promise.all(
      images.map(async (image) => {
        const imageId = image.MLImageAssessmentId;
        const imageUrl = image.S3AssessedImageUrl;

        // Fetch damage assessments for this image
        const damageResult = await pool.request()
          .input('imageId', sql.Int, imageId)
          .query(`
            SELECT
              a.MLCaseImageAssessmentId,
              a.CarPartMasterID,
              a.DamageTypeID,
              a.RepairReplaceID,
              a.ActualCostRepair,
              cp.CarPartName,
              cp.PartType,
              rr.RepairReplace
            FROM MLCaseImageAssessment a
            INNER JOIN CarPartMaster cp ON a.CarPartMasterID = cp.CarPartMasterID
            INNER JOIN RepairReplace rr ON a.RepairReplaceID = rr.RepairReplaceID
            WHERE a.MLImageAssessmentID = @imageId
          `);

        // Map DamageTypeID to DamageType
        const damages = damageResult.recordset.map((damage) => {
          let DamageType = '';
          switch (damage.DamageTypeID) {
            case 0:
              DamageType = 'Scratch';
              break;
            case 1:
              DamageType = 'Dent';
              break;
            case 2:
              DamageType = 'Broken';
              break;
            default:
              DamageType = 'Unknown';
          }
          return {
            ...damage,
            DamageType,
          };
        });

        return {
          imageId: imageId,
          imageUrl: imageUrl,
          damageInfo: damages,
        };
      })
    );

    res.json({ images: imagesWithReports });
  } catch (error) {
    console.error('Error fetching images and reports:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
