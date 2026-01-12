try {
    const commonRoutes = require('./app/officers/common/common.routes');
    const dgoRoutes = require('./app/officers/dgo/dgo.routes');
    const sgwaRoutes = require('./app/officers/sgwa/sgwa.routes');
    const enforcementRoutes = require('./app/officers/enforcement/enforcement.routes');

    console.log("All Officer Routes loaded successfully.");
} catch (error) {
    console.error("Error loading routes:", error);
    process.exit(1);
}
