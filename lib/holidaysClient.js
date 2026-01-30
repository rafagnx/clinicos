/**
 * Holidays API Client
 * Handles national and local holidays management
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

export const holidaysApi = {
    /**
     * Fetch holidays for the organization
     * @param {Object} params - Query parameters
     * @param {number} [params.year] - Filter by year (optional)
     * @returns {Promise<Array>} List of holidays
     */
    list: async ({ year } = {}) => {
        const params = year ? `?year=${year}` : '';

        const response = await fetch(`${API_BASE}/api/holidays${params}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch holidays');
        }

        return response.json();
    },

    /**
     * Create a new local holiday (Admin only)
     * @param {Object} data - Holiday data
     * @param {string} data.date - Holiday date (YYYY-MM-DD)
     * @param {string} data.name - Holiday name
     * @returns {Promise<Object>} Created holiday
     */
    create: async ({ date, name }) => {
        const response = await fetch(`${API_BASE}/api/holidays`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date, name })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create holiday');
        }

        return response.json();
    },

    /**
     * Delete a local holiday (Admin only)
     * @param {string} id - Holiday ID
     * @returns {Promise<Object>} Deletion result
     */
    delete: async (id) => {
        const response = await fetch(`${API_BASE}/api/holidays/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete holiday');
        }

        return response.json();
    },

    /**
     * Import Brazilian national holidays (Admin only)
     * @returns {Promise<Object>} Import result with count
     */
    seed: async () => {
        const response = await fetch(`${API_BASE}/api/holidays/seed`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to seed holidays');
        }

        return response.json();
    }
};
