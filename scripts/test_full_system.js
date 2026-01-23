
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3333';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = 'rafamarketingdb@gmail.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Rafa040388?';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let authToken = '';
let activeOrgId = '';
let userId = '';

const api = axios.create({
    baseURL: API_URL,
    validateStatus: () => true // Don't throw on error
});

const log = (msg, type = 'info') => {
    const symbol = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    console.log(`${symbol} ${msg}`);
};

async function login() {
    log('Attempting Login...', 'info');
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (error) {
        log(`Login Failed: ${error.message}`, 'error');
        process.exit(1);
    }

    authToken = session.access_token;
    userId = user.id;
    log(`Login Successful. User ID: ${userId}`, 'success');

    // Fetch Autosynced Organizations
    log('Fetching User Organizations...', 'info');
    const res = await api.get('/api/user/organizations', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.status === 200 && res.data.length > 0) {
        activeOrgId = res.data[0].organizationId;
        log(`Organization Fetch Success. Active Org ID: ${activeOrgId}`, 'success');

        // Check if Master Org exists
        const masterOrg = res.data.find(o => o.slug === 'master-admin');
        if (masterOrg) {
            log('Master Admin Organization Found!', 'success');
        } else {
            log('Master Admin Organization Missing', 'error');
        }
    } else {
        log(`Organization Fetch Failed or Empty. Status: ${res.status}`, 'error');
        console.log(res.data);
    }
}

async function testDashboard() {
    log('Testing Dashboard Metrics...', 'info');
    const res = await api.get('/api/Appointment', {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-organization-id': activeOrgId
        },
        params: { limit: 1 }
    });

    if (res.status === 200) {
        log('Dashboard/Appointment Access Successful', 'success');
    } else {
        log(`Dashboard Access Failed: ${res.status}`, 'error');
    }
}

async function testPatientCRUD() {
    log('Testing Patient CRUD...', 'info');

    // 1. Create
    const newPatient = {
        name: `Test Patient ${Date.now()}`,
        phone: '11999999999',
        email: `test${Date.now()}@example.com`,
        status: 'active'
    };

    const createRes = await api.post('/api/Patient', newPatient, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-organization-id': activeOrgId
        }
    });

    if (createRes.status === 200) {
        log('Patient Creation Successful', 'success');
        const patientId = createRes.data.id;

        // 2. Read
        const readRes = await api.get('/api/Patient', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'x-organization-id': activeOrgId
            },
            params: { id: patientId }
        });

        if (readRes.status === 200 && readRes.data.length > 0) {
            log('Patient Read Successful', 'success');

            // 3. Delete
            const deleteRes = await api.delete(`/api/Patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'x-organization-id': activeOrgId
                }
            });

            if (deleteRes.status === 200) {
                log('Patient Delete Successful', 'success');
            } else {
                log(`Patient Delete Failed: ${deleteRes.status}`, 'error');
            }

        } else {
            log(`Patient Read Failed: ${readRes.status}`, 'error');
        }
    } else {
        log(`Patient Creation Failed: ${createRes.status}`, 'error');
        console.log(createRes.data);
    }
}

async function testAdminBypass() {
    log('Testing Admin Bypass...', 'info');
    // Requires Admin Role
    const res = await api.post(`/api/admin/organizations/${activeOrgId}/bypass`, { active: true }, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-organization-id': activeOrgId
        }
    });

    if (res.status === 200) {
        log('Admin Bypass Successful', 'success');
    } else {
        log(`Admin Bypass Failed: ${res.status}`, 'error');
        console.log(res.data);
    }
}

async function run() {
    console.log('🚀 Starting Full System Test...');
    try {
        await login();
        if (activeOrgId) {
            await testDashboard();
            await testPatientCRUD();
            await testAdminBypass();
        } else {
            log('Skipping CRUD tests due to missing Organization ID', 'error');
        }
    } catch (e) {
        log(`Unexpected Script Error: ${e.message}`, 'error');
        console.error(e);
    }
    console.log('🏁 Test Complete');
    process.exit(0);
}

run();
