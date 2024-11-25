const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Endpoint: Get report data for a specific image by `referenceNo` and `imageName`
router.get('/:referenceNo/:imageName', async (req, res) => {
  const { referenceNo, imageName } = req.params;

  try {
    const pool = await poolPromise;

    // Step 1: Fetch the MLImageAssessmentId using the referenceNo
    const imageAssessmentResult = await pool.request()
      .input('referenceNo', sql.NVarChar, referenceNo)
      .query(`
        SELECT TOP 1 MLImageAssessmentId, ReferenceNo, S3AssessedImageUrl, Status
        FROM [db_motor].[dbo].[MLImageAssessment]
        WHERE ReferenceNo = @referenceNo
      `);

    if (imageAssessmentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'No data found for the given reference number' });
    }

    const imageAssessment = imageAssessmentResult.recordset[0];

    // Step 2: Fetch damage data using the MLImageAssessmentId and imageName
    const damageDataResult = await pool.request()
      .input('imageName', sql.NVarChar, imageName)
      .input('assessmentId', sql.Int, imageAssessment.MLImageAssessmentId)
      .query(`
        SELECT 
          MLCaseImageAssessmentId,
          ImageName,
          CarPartMasterID,
          DamageTypeID,
          RepairReplaceID,
          ActualCostRepair
        FROM [db_motor].[dbo].[MLCaseImageAssessment]
        WHERE MLImageAssessmentID = @assessmentId AND ImageName = @imageName
      `);

    if (damageDataResult.recordset.length === 0) {
      return res.status(404).json({ message: 'No damage data found for the specified image' });
    }

    // Map DamageTypeID to readable DamageType
    const damageData = damageDataResult.recordset.map((damage) => {
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

    // Step 3: Construct the response
    const response = {
      imageDetails: {
        ReferenceNo: imageAssessment.ReferenceNo,
        S3AssessedImageUrl: imageAssessment.S3AssessedImageUrl,
        Status: imageAssessment.Status,
      },
      damageAnnotations: damageData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching image and damage data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
