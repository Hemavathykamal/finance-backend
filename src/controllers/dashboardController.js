const dashboardService = require("../services/dashboardService");

function summary(req, res, next) {
  try {
    res.json({ data: dashboardService.getSummary() });
  } catch (err) {
    next(err);
  }
}

function categoryTotals(req, res, next) {
  try {
    res.json({ data: dashboardService.getCategoryTotals() });
  } catch (err) {
    next(err);
  }
}

function monthlyTrends(req, res, next) {
  try {
    const months = req.query.months || 6;
    res.json({ data: dashboardService.getMonthlyTrends(months) });
  } catch (err) {
    next(err);
  }
}

function weeklyTrends(req, res, next) {
  try {
    res.json({ data: dashboardService.getWeeklyTrends() });
  } catch (err) {
    next(err);
  }
}

function recentActivity(req, res, next) {
  try {
    const limit = req.query.limit || 10;
    res.json({ data: dashboardService.getRecentActivity(limit) });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, categoryTotals, monthlyTrends, weeklyTrends, recentActivity };
