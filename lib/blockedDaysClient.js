/**
 * Blocked Days API Client
 * Handles calendar blocking operations for professionals
 */
import { api } from './base44Client';

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
        try {
            const response = await api.get('/blocked-days', {
                params: {
                    professionalId: String(professionalId),
                    startDate,
                    endDate
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blocked days:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch blocked days');
        }
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
        try {
            const response = await api.post('/blocked-days', {
                professionalId,
                startDate,
                endDate,
                reason,
                confirmConflicts
            });
            return response.data;
        } catch (error) {
            console.error('Failed to create blocked period:', error);
            if (error.response?.data?.conflicts) {
                return error.response.data; // Return conflicts structure to frontend
            }
            throw new Error(error.response?.data?.error || 'Failed to create blocked period');
        }
    },

    /**
     * Update the reason of an existing block
     * @param {string} id - Block ID
     * @param {Object} data - Update data
     * @param {string} data.reason - New reason
     * @returns {Promise<Object>} Updated block
     */
    update: async (id, { reason }) => {
        try {
            const response = await api.patch(`/blocked-days/${id}`, { reason });
            return response.data;
        } catch (error) {
            console.error('Failed to update blocked period:', error);
            throw new Error(error.response?.data?.error || 'Failed to update blocked period');
        }
    },

    /**
     * Delete a blocked period
     * @param {string} id - Block ID
     * @returns {Promise<Object>} Deletion result
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/blocked-days/${id}`);
            return response.data;
        } catch (error) {
            console.error('Failed to delete blocked period:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete blocked period');
        }
    }
};
