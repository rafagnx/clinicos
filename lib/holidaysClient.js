/**
 * Holidays API Client
 * Handles national and local holidays management
 */
import { api } from './base44Client';

export const holidaysApi = {
    /**
     * Fetch holidays for the organization
     * @param {Object} params - Query parameters
     * @param {number} [params.year] - Filter by year (optional)
     * @returns {Promise<Array>} List of holidays
     */
    list: async ({ year } = {}) => {
        const params = year ? { year } : {};
        try {
            const response = await api.get('/holidays', { params });
            // Backend returns array directly or {data: []}
            return response.data;
        } catch (error) {
            console.error('Failed to fetch holidays:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch holidays');
        }
    },

    /**
     * Create a new local holiday (Admin only)
     * @param {Object} data - Holiday data
     * @param {string} data.date - Holiday date (YYYY-MM-DD)
     * @param {string} data.name - Holiday name
     * @returns {Promise<Object>} Created holiday
     */
    create: async ({ date, name }) => {
        try {
            const response = await api.post('/holidays', { date, name });
            return response.data;
        } catch (error) {
            console.error('Failed to create holiday:', error);
            throw new Error(error.response?.data?.error || 'Failed to create holiday');
        }
    },

    /**
     * Delete a local holiday (Admin only)
     * @param {string} id - Holiday ID
     * @returns {Promise<Object>} Deletion result
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/holidays/${id}`);
            return response.data;
        } catch (error) {
            console.error('Failed to delete holiday:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete holiday');
        }
    },

    /**
     * Import Brazilian national holidays (Admin only)
     * @returns {Promise<Object>} Import result with count
     */
    seed: async () => {
        try {
            const response = await api.post('/holidays/seed');
            return response.data;
        } catch (error) {
            console.error('Failed to seed holidays:', error);
            throw new Error(error.response?.data?.error || 'Failed to seed holidays');
        }
    }
};
