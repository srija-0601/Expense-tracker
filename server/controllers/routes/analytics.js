const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getCategoryAnalytics,
  getSummary,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAnalytics);
router.get('/category', getCategoryAnalytics);
router.get('/summary', getSummary);

module.exports = router;
