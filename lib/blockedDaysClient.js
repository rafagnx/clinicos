/**
 * Blocked Days API Client
 * Handles calendar blocking operations for professionals
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const blockedDaysApi = {
    /**
     * Fetch blocked days for a professional within a date range
     * @param {Object} params - Query parameters
     * @param {number} params.professionalId - Professional ID
     * @param {string} params.startDate - Start date (YYYY-MM-DD)
     * @param {string} params.endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} List of blocked day periods
     */
    list: async ({ professionalId, startDate, endDate }) => {
        const params = new URLSearchParams({
            professionalId: String(professionalId),
            startDate,
            endDate
        });

        const response = await fetch(`${API_BASE}/api/blocked-days?${params}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch blocked days');
        }

        return response.json();
    },

    /**
     * Create a new blocked period
     * @param {Object} data - Block data
     * @param {number} data.professionalId - Professional ID
     * @param {string} data.startDate - Start date (YYYY-MM-DD)
     * @param {string} data.endDate - End date (YYYY-MM-DD)
     * @param {string} data.reason - Reason for blocking
     * @param {boolean} data.confirmConflicts - Confirm even if conflicts exist
     * @returns {Promise<Object>} Created block or conflicts object
     */
    create: async ({ professionalId, startDate, endDate, reason, confirmConflicts = false }) => {
        const response = await fetch(`${API_BASE}/api/blocked-days`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                professionalId,
                startDate,
                endDate,
                reason,
                confirmConflicts
            })
        });

        if (!response.ok && response.status !== 200) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create blocked period');
        }

        return response.json();
    },

    /**
     * Update the reason of an existing block
     * @param {string} id - Block ID
     * @param {Object} data - Update data
     * @param {string} data.reason - New reason
     * @returns {Promise<Object>} Updated block
     */
    update: async (id, { reason }) => {
        const response = await fetch(`${API_BASE}/api/blocked-days/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update blocked period');
        }

        return response.json();
    },

    /**
     * Delete a blocked period
     * @param {string} id - Block ID
     * @returns {Promise<Object>} Deletion result
     */
    delete: async (id) => {
        const response = await fetch(`${API_BASE}/api/blocked-days/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete blocked period');
        }

        return response.json();
    }
};
