const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Fetch car parts
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT CarPartMasterID, CarPartName
      FROM [db_motor].[dbo].[CarPartMaster]
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching car parts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch cost of repair
router.get('/costofrepair', async (req, res) => {
    const { carPartMasterId, damageTypeId, repairReplaceId } = req.query;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('carPartMasterId', sql.Int, carPartMasterId)
        .input('damageTypeId', sql.Int, damageTypeId)
        .input('repairReplaceId', sql.Int, repairReplaceId)
        .query(`
          SELECT CostOfRepair
          FROM [db_motor].[dbo].[CostOfRepair]
          WHERE CarPartMasterId = @carPartMasterId
            AND DamageTypeId = @damageTypeId
            AND RepairReplaceId = @repairReplaceId;
        `);
  
      if (result.recordset.length > 0) {
        // If cost is found in the database, return it
        res.json(result.recordset[0]);
      } else {
        // Fallback cost generation logic
        let fallbackCost;
        switch (parseInt(damageTypeId)) {
          case 0:
            fallbackCost = 200;
            break;
          case 1:
            fallbackCost = 300;
            break;
          case 2:
            fallbackCost = 500;
            break;
          default:
            fallbackCost = 0; // Default cost for undefined damage types
        }
        res.json({ CostOfRepair: fallbackCost });
      }
    } catch (error) {
      console.error('Error fetching repair cost:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;
