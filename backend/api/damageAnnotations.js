const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Fetch Damage Annotations by ReferenceNo and ImageName
// Fetch Damage Annotations by ReferenceNo and ImageName
router.get('/:referenceNo/:imageName', async (req, res) => {
  const { referenceNo, imageName } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('referenceNo', sql.NVarChar, referenceNo)
      .input('imageName', sql.NVarChar, imageName)
      .query(`
        SELECT 
          a.MLCaseImageAssessmentId,
          a.CarPartMasterID, 
          cp.CarPartName,
          cp.PartType,
          a.DamageTypeID,
          a.RepairReplaceID,
          a.ActualCostRepair
        FROM MLCaseImageAssessment a
        INNER JOIN MLImageAssessment ia ON a.MLImageAssessmentID = ia.MLImageAssessmentId
        INNER JOIN CarPartMaster cp ON a.CarPartMasterID = cp.CarPartMasterID
        WHERE ia.ReferenceNo = @referenceNo
          AND a.ImageName = @imageName
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching damage annotations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Insert Damage Annotation
router.post('/', async (req, res) => {
  const { carPartMasterId, damageTypeId, repairReplaceId, actualCostRepair, imageName, referenceNo } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('carPartMasterId', sql.Int, carPartMasterId)
      .input('damageTypeId', sql.Int, damageTypeId)
      .input('repairReplaceId', sql.Int, repairReplaceId)
      .input('actualCostRepair', sql.Decimal(10, 2), actualCostRepair)
      .input('imageName', sql.NVarChar, imageName)
      .input('referenceNo', sql.NVarChar, referenceNo)
      .query(`
        INSERT INTO MLCaseImageAssessment (MLImageAssessmentID, CarPartMasterID, DamageTypeID, RepairReplaceID, ActualCostRepair, ImageName)
        VALUES (
          (SELECT MLImageAssessmentId FROM MLImageAssessment WHERE ReferenceNo = @referenceNo),
          @carPartMasterId,
          @damageTypeId,
          @repairReplaceId,
          @actualCostRepair,
          @imageName
        )
      `);
    res.status(201).json({ message: 'Damage annotation inserted successfully' });
  } catch (error) {
    console.error('Error inserting damage annotation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Damage Annotation
// Update Damage Annotation
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { carPartMasterId, damageTypeId, repairReplaceId, actualCostRepair } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('carPartMasterId', sql.Int, carPartMasterId)
      .input('damageTypeId', sql.Int, damageTypeId)
      .input('repairReplaceId', sql.Int, repairReplaceId)
      .input('actualCostRepair', sql.Decimal(10, 2), actualCostRepair)
      .query(`
        UPDATE MLCaseImageAssessment
        SET
          CarPartMasterID = @carPartMasterId,
          DamageTypeID = @damageTypeId,
          RepairReplaceID = @repairReplaceId,
          ActualCostRepair = @actualCostRepair
        WHERE MLCaseImageAssessmentId = @id
      `);
    res.json({ message: 'Damage annotation updated successfully' });
  } catch (error) {
    console.error('Error updating damage annotation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Delete Damage Annotation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM MLCaseImageAssessment WHERE MLCaseImageAssessmentId = @id
      `);
    res.json({ message: 'Damage annotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting damage annotation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save All Damage Annotations
router.post('/save', async (req, res) => {
  const annotations = req.body;

  try {
    const pool = await poolPromise;

    for (const annotation of annotations) {
      const { carPartMasterId, damageTypeId, repairReplaceId, actualCostRepair, imageName, referenceNo } = annotation;

      await pool.request()
        .input('carPartMasterId', sql.Int, carPartMasterId)
        .input('damageTypeId', sql.Int, damageTypeId)
        .input('repairReplaceId', sql.Int, repairReplaceId)
        .input('actualCostRepair', sql.Decimal(10, 2), actualCostRepair)
        .input('imageName', sql.NVarChar, imageName)
        .input('referenceNo', sql.NVarChar, referenceNo)
        .query(`
          MERGE INTO MLCaseImageAssessment AS target
          USING (VALUES (@referenceNo, @imageName, @carPartMasterId)) AS source (ReferenceNo, ImageName, CarPartMasterId)
          ON target.ImageName = source.ImageName AND target.CarPartMasterID = source.CarPartMasterId
          WHEN MATCHED THEN
            UPDATE SET
              DamageTypeID = @damageTypeId,
              RepairReplaceID = @repairReplaceId,
              ActualCostRepair = @actualCostRepair
          WHEN NOT MATCHED THEN
            INSERT (MLImageAssessmentID, CarPartMasterID, DamageTypeID, RepairReplaceID, ActualCostRepair, ImageName)
            VALUES (
              (SELECT MLImageAssessmentId FROM MLImageAssessment WHERE ReferenceNo = @referenceNo),
              @carPartMasterId,
              @damageTypeId,
              @repairReplaceId,
              @actualCostRepair,
              @imageName
            );
        `);
    }

    res.json({ message: 'All damage annotations saved successfully' });
  } catch (error) {
    console.error('Error saving damage annotations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
