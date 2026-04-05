const express = require("express");
const router = express.Router();
const recordController = require("../controllers/recordController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, createRecordSchema, updateRecordSchema } = require("../middleware/validate");

router.use(authenticate);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List all financial records (with optional filters and pagination)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *         description: Filter by type
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category (partial match)
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2026-01-01" }
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2026-04-30" }
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of records with pagination info
 *       401:
 *         description: Not authenticated
 */
router.get("/", recordController.listRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single financial record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The financial record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found
 */
router.get("/:id", recordController.getRecord);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new financial record (analyst and admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:   { type: number, example: 5000 }
 *               type:     { type: string, enum: [income, expense] }
 *               category: { type: string, example: "Salary" }
 *               date:     { type: string, example: "2026-04-01" }
 *               notes:    { type: string, example: "Monthly salary" }
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied (viewer role cannot create records)
 */
router.post(
  "/",
  authorize("admin", "analyst"),
  validate(createRecordSchema),
  recordController.createRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   patch:
 *     summary: Update a financial record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:   { type: number }
 *               type:     { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               date:     { type: string }
 *               notes:    { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Access denied (only admin can update)
 *       404:
 *         description: Record not found
 */
router.patch(
  "/:id",
  authorize("admin"),
  validate(updateRecordSchema),
  recordController.updateRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft delete a record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted (soft delete - data is kept internally)
 *       403:
 *         description: Access denied
 *       404:
 *         description: Record not found
 */
router.delete("/:id", authorize("admin"), recordController.deleteRecord);

module.exports = router;
