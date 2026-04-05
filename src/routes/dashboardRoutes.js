const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get total income, expenses, and net balance (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_income:   { type: number, example: 226500 }
 *                     total_expenses: { type: number, example: 78000 }
 *                     net_balance:    { type: number, example: 148500 }
 *                     total_records:  { type: integer, example: 15 }
 */
router.get("/summary", dashboardController.summary);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get totals grouped by category (analyst and admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 *       403:
 *         description: Access denied (viewer cannot access this)
 */
router.get("/categories", authorize("analyst", "admin"), dashboardController.categoryTotals);

/**
 * @swagger
 * /api/dashboard/trends/monthly:
 *   get:
 *     summary: Get monthly income vs expense trends (analyst and admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6 }
 *         description: How many months back to include
 *     responses:
 *       200:
 *         description: Monthly trend data
 *       403:
 *         description: Access denied
 */
router.get("/trends/monthly", authorize("analyst", "admin"), dashboardController.monthlyTrends);

/**
 * @swagger
 * /api/dashboard/trends/weekly:
 *   get:
 *     summary: Get weekly income vs expense trends for the last 12 weeks (analyst and admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly trend data
 *       403:
 *         description: Access denied
 */
router.get("/trends/weekly", authorize("analyst", "admin"), dashboardController.weeklyTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get the most recent financial records (analyst and admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of records to return (max 50)
 *     responses:
 *       200:
 *         description: Recent activity list
 *       403:
 *         description: Access denied
 */
router.get("/recent", authorize("analyst", "admin"), dashboardController.recentActivity);

module.exports = router;
