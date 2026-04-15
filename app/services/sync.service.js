const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Build the unified sync payload accepted by all backends:
 *   - server     (Node.js, :5000)  → POST /api/sync-user
 *   - MIS Django (:8000)           → POST /api/sync-user/
 *   - GIS Django (:8001)           → POST /api/account/sync-user/
 *
 * All backends only need: firstName, lastName, email, username, password
 * Extra fields (address, etc.) are accepted by server but ignored by Django.
 */
const _buildPayload = (userData) => {
    return {
        firstName: userData.firstName || (userData.name || '').split(' ')[0] || '',
        lastName: userData.lastName || (userData.name || '').split(' ').slice(1).join(' ') || '',
        email: userData.email,
        username: userData.username,
        password: userData.plainPassword || userData.password || '',
        phone: userData.phone || userData.mobile || '',
        userType: userData.userType || 'APPLICANT',
        // Flat address fields (server uses these)
        name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.name,
        mobile: userData.phone || userData.mobile || '',
        address: userData.communicationAddress?.addressLine1 || userData.address || '',
        state: userData.communicationAddress?.state || userData.state || '',
        district: userData.communicationAddress?.district || userData.district || '',
        pincode: userData.communicationAddress?.pincode || userData.pincode || '',
        dob: userData.dateOfBirth || userData.dob || null,
        gender: userData.gender || '',
        uid: userData.uidNumber || userData.uid || '',
        idProofType: userData.idProofType || '',
        idProofNo: userData.idProofNumber || userData.idProofNo || '',
        role: (userData.userType === 'RSGWA' || userData.userType === 'DGO') ? 'Admin' : 'User',
        initialSync: true,
    };
};

/**
 * Sync user from SGWA to all other backends in PARALLEL.
 * One failure does NOT block the others.
 */
const syncUserToServer = async (userData) => {
    const syncKey = process.env.SYNC_SECRET_KEY || 'sgwa_sync_secret_2024_key';
    const payload = _buildPayload(userData);

    const endpoints = [
        {
            name: 'Server',
            url: `${process.env.OTHER_API_URL || 'http://127.0.0.1:5000'}/api/sync-user`
        },
        {
            name: 'MIS',
            url: process.env.MIS_API_URL || 'http://127.0.0.1:8000/api/sync-user/'
        },
        {
            name: 'GIS',
            url: process.env.GIS_API_URL || 'http://127.0.0.1:8001/api/account/sync-user/'
        },
    ];

    logger.info(`[SGWA→ALL] Starting parallel sync for ${userData.email || userData.username}...`);

    const results = await Promise.allSettled(
        endpoints.map(async (ep) => {
            try {
                logger.info(`[SGWA→${ep.name}] Posting to ${ep.url}`);
                const res = await axios.post(ep.url, payload, {
                    headers: { 'X-Auth-Sync-Key': syncKey },
                    timeout: 5000,
                });
                logger.info(`[SGWA→${ep.name}] ✅ SUCCESS: ${JSON.stringify(res.data)}`);
                return { name: ep.name, success: true };
            } catch (err) {
                const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
                logger.warn(`[SGWA→${ep.name}] ⚠️ FAILED (non-blocking): ${detail}`);
                return { name: ep.name, success: false, error: detail };
            }
        })
    );

    return results.map(r => r.value || r.reason);
};

module.exports = {
    syncUserToServer,
};