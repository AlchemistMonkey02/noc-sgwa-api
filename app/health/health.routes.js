const router = require('express').Router();
const healthController = require('./health.controller');

// GET /api/health - Basic health check
router.get('/', healthController.check);

// GET /api/health/detailed - Detailed health with database status
router.get('/detailed', healthController.detailed);

// GET /api/health/ready - Readiness probe (Kubernetes)
router.get('/ready', healthController.ready);

// GET /api/health/live - Liveness probe (Kubernetes)
router.get('/live', healthController.live);

module.exports = router;
