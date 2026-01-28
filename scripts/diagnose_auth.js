
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = 'https://clinicos-it4q.onrender.com/api'; // Hardcoded production backend

console.log('🔍 Starting ClinicOS Auth Diagnosis...');
console.log(`📌 Supabase URL: ${SUPABASE_URL}`);
console.log(`📌 Backend URL: ${BACKEND_URL}`);

async function run() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing Supabase Environment Variables!');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Test Supabase Connection & Login
    console.log('\nTesting Supabase Auth...');
    // We can't interactively login with Google here, but we can try a dummy login or just check service health
    // Actually, let's try to verify a known dummy token or simply check if the URL is reachable
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('⚠️ Supabase Session Check Error:', error.message);
        else console.log('✅ Supabase Connection OK');
    } catch (e) {
        console.error('❌ Supabase Connection Failed:', e.message);
    }

    // 2. Test Backend Configuration (Remote)
    console.log('\nFetching Remote Backend Configuration...');
    try {
        const res = await axios.get(`${BACKEND_URL}/debug-auth-config`);
        console.log('✅ Remote Configuration Received:');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('❌ Failed to fetch remote config:', e.message);
        if (e.response) console.error('   Status:', e.response.status);
    }

    // 3. Test Backend Auth Rejection (Expected 401)
    console.log('\nTesting Backend Auth Security (Expect 401)...');
    try {
        await axios.get(`${BACKEND_URL}/Professional`);
        console.error('❌ SECURITY RISK: Backend allowed request without token!');
    } catch (e) {
        if (e.response && e.response.status === 401) {
            console.log('✅ Backend correctly rejected no-token request (401)');
            console.log('   Error Detail:', e.response.data);
        } else {
            console.error('⚠️ Unexpected error:', e.message);
        }
    }

    // 4. Test Emergency Bypass (Mock Token)
    // We will create a fake signed token (which Supabase would reject, but our Fallback might catch if configured VERY loosely, 
    // but actually our Fallback requires checking signature failure first. 
    // Since we can't easily sign a token that Supabase verify() would try to parse without a key, 
    // we instruct the USER on what to do.

    console.log('\n--- DIAGNOSIS COMPLETE ---');
}

run();
