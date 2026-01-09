/**
 * Standardized Response Handler
 */

class ResponseHandler {
    /**
     * Success response
     */
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Created response (201)
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * Paginated response
     */
    static paginated(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                pages: pagination.pages || Math.ceil(pagination.total / pagination.limit)
            },
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * No content response (204)
     */
    static noContent(res) {
        return res.status(204).send();
    }

    /**
     * File download response
     */
    static file(res, filePath, fileName) {
        return res.download(filePath, fileName);
    }

    /**
     * Redirect response
     */
    static redirect(res, url, statusCode = 302) {
        return res.redirect(statusCode, url);
    }
}

module.exports = ResponseHandler;
