import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yhfjhovhemgcamigimaj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZmpob3ZoZW1nY2FtaWdpbWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzE1NzAsImV4cCI6MjA4NDY0NzU3MH0.6a8aSDM12eQwTRZES5r_hqFDGq2akKt9yMOys3QzodQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE_URL = 'http://localhost:3001/api';

async function testFullFlow() {
    console.log('🧪 Testing ClinicOS Full Flow...\n');

    // Step 1: Get Supabase Session (simulate login)
    console.log('📝 Step 1: Checking Supabase Session...');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.log('❌ No active session. Please login first.');
        console.log('   Run: supabase.auth.signInWithPassword({ email, password })');
        return;
    }

    const token = session.access_token;
    const userId = session.user.id;
    console.log('✅ Session found for user:', session.user.email);

    // Step 2: Get User Organizations
    console.log('\n📝 Step 2: Fetching User Organizations...');
    try {
        const orgsResponse = await axios.get(`${BASE_URL}/user/organizations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Organizations:', orgsResponse.data);

        if (orgsResponse.data.length === 0) {
            console.log('⚠️  No organizations found. System will auto-create for admin user.');
        }

        const orgId = orgsResponse.data[0]?.organizationId;
        if (!orgId) {
            console.log('❌ No organization ID available');
            return;
        }

        console.log('✅ Using Organization ID:', orgId);

        // Step 3: Test Patient Creation
        console.log('\n📝 Step 3: Testing Patient Creation...');
        try {
            const patientData = {
                name: 'Teste Paciente ' + Date.now(),
                email: 'teste@example.com',
                phone: '11999999999',
                cpf: '12345678900',
                birth_date: '1990-01-01',
                status: 'active'
            };

            const patientResponse = await axios.post(`${BASE_URL}/Patient`, patientData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-organization-id': orgId,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Patient Created:', patientResponse.data);
        } catch (error) {
            console.error('❌ Patient Creation Failed:', error.response?.data || error.message);
        }

        // Step 4: Test Professional Creation
        console.log('\n📝 Step 4: Testing Professional Creation...');
        try {
            const professionalData = {
                name: 'Dr. Teste ' + Date.now(),
                email: 'drtest' + Date.now() + '@example.com',
                specialty: 'Dermatologia',
                status: 'ativo'
            };

            const professionalResponse = await axios.post(`${BASE_URL}/Professional`, professionalData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-organization-id': orgId,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Professional Created:', professionalResponse.data);
        } catch (error) {
            console.error('❌ Professional Creation Failed:', error.response?.data || error.message);
        }

        // Step 5: Test Appointment Creation
        console.log('\n📝 Step 5: Testing Appointment Creation...');
        try {
            const appointmentData = {
                start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
                status: 'agendado',
                type: 'consulta',
                notes: 'Teste de agendamento'
            };

            const appointmentResponse = await axios.post(`${BASE_URL}/Appointment`, appointmentData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-organization-id': orgId,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Appointment Created:', appointmentResponse.data);
        } catch (error) {
            console.error('❌ Appointment Creation Failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Organizations Fetch Failed:', error.response?.data || error.message);
    }

    console.log('\n✨ Full Flow Test Complete!');
}

testFullFlow().catch(console.error);
