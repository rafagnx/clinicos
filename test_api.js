// Test script to verify all API endpoints
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testAPIs() {
    console.log('🧪 Testing ClinicOS API Endpoints...\n');

    // Test 1: Health Check
    try {
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', health.data);
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
    }

    // Test 2: Diagnostics
    try {
        const diagnostics = await axios.get(`${BASE_URL}/diagnostics`);
        console.log('✅ Diagnostics:', diagnostics.data);
    } catch (error) {
        console.error('❌ Diagnostics Failed:', error.message);
    }

    // Test 3: Migration
    try {
        const migration = await axios.post(`${BASE_URL}/debug/migrate`);
        console.log('✅ Migration:', migration.data);
    } catch (error) {
        console.error('❌ Migration Failed:', error.message);
    }

    console.log('\n✨ API Tests Complete!');
}

testAPIs();
