const mongoose = require('mongoose');

/**
 * Health Check Controller
 */
class HealthController {
    /**
     * GET /api/health
     * Basic health check
     */
    async check(req, res) {
        const healthCheck = {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0'
        };

        res.status(200).json({
            success: true,
            data: healthCheck,
            message: "Health check completed"
        });
    }

    /**
     * GET /api/health/detailed
     * Detailed health check with database status
     */
    async detailed(req, res) {
        const healthCheck = {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            services: {}
        };

        // Check database
        try {
            const dbState = mongoose.connection.readyState;
            healthCheck.services.database = {
                status: dbState === 1 ? 'connected' : 'disconnected',
                state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState]
            };
        } catch (error) {
            healthCheck.services.database = {
                status: 'error',
                error: error.message
            };
            healthCheck.status = 'unhealthy';
        }

        // Check memory usage
        const memUsage = process.memoryUsage();
        healthCheck.memory = {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        };

        const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
            success: healthCheck.status === 'healthy',
            data: healthCheck,
            message: healthCheck.status === 'healthy' ? "Detailed health check completed" : "System is unhealthy"
        });
    }

    /**
     * GET /api/health/ready
     * Readiness probe for Kubernetes
     */
    async ready(req, res) {
        const isReady = mongoose.connection.readyState === 1;

        if (isReady) {
            res.status(200).json({
                success: true,
                data: { status: 'ready' },
                message: "System is ready"
            });
        } else {
            res.status(503).json({
                success: false,
                data: { status: 'not ready' },
                message: "System is not ready"
            });
        }
    }

    /**
     * GET /api/health/live
     * Liveness probe for Kubernetes
     */
    async live(req, res) {
        res.status(200).json({
            success: true,
            data: { status: 'alive' },
            message: "System is live"
        });
    }
}

module.exports = new HealthController();
