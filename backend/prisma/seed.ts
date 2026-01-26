import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    const orgSlug = 'demo-clinic';
    const professionalEmail = 'house@clinicos.app';

    // 1. CLEANUP: Delete existing demo organization (Cascade deletes patients/professionals)
    // This ensures a clean slate and avoids unique constraint errors.
    console.log('🧹 Cleaning up old seed data...');
    try {
        await prisma.organization.deleteMany({
            where: { slug: orgSlug }
        });
    } catch (e) {
        console.warn("Cleanup warning (ignorable):", e);
    }

    // 2. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'ClinicOS Demo',
            slug: orgSlug,
            subscriptionStatus: 'active',
            logo: 'https://cdn-icons-png.flaticon.com/512/3063/3063176.png'
        },
    });
    console.log(`🏥 Organization Created: ${org.name} (${org.id})`);

    // Create Dev User and Membership
    const devUser = await prisma.user.upsert({
        where: { id: 'dev-user' },
        update: {},
        create: {
            id: 'dev-user',
            email: 'dev@example.com',
            name: 'Rafa (Dev)',
            image: 'https://github.com/nutlope.png',
        }
    });

    await prisma.member.create({
        data: {
            organizationId: org.id,
            userId: devUser.id,
            role: 'owner'
        }
    });
    console.log(`👤 Dev User and Membership created.`);

    // 3. Create Professional (Now using create, as we know it's clean)
    const professional = await prisma.professional.create({
        data: {
            name: 'Dr. Gregory House',
            email: professionalEmail,
            organizationId: org.id,
            color: '#8b5cf6',
            roleType: 'hof',
            specialty: 'Diagnóstico',
        }
    });

    const devProfessional = await prisma.professional.create({
        data: {
            name: 'Rafa (Dev)',
            email: 'dev@example.com',
            organizationId: org.id,
            color: '#3B82F6',
            roleType: 'profissional',
            specialty: 'Desenvolvimento',
        }
    });
    console.log(`👨‍⚕️ Professionals Created: ${professional.name}, ${devProfessional.name}`);

    // 4. Create Patients
    const patientsData = [
        { name: 'Ana Silva', email: 'ana@example.com', phone: '11999887766' },
        { name: 'Carlos Santos', email: 'carlos@example.com', phone: '11988776655' },
        { name: 'Beatriz Costa', email: 'bia@example.com', phone: '11977665544' },
        { name: 'João Oliveira', email: 'joao@example.com', phone: '11966554433' },
        { name: 'Maria Souza', email: 'maria@example.com', phone: '11955443322' },
    ];

    for (const p of patientsData) {
        await prisma.patient.create({
            data: {
                name: p.name,
                email: p.email,
                phone: p.phone,
                organizationId: org.id,
                status: 'ativo',
                notes: 'Paciente demo seed.'
            }
        });
    }
    console.log(`👥 Created ${patientsData.length} patients.`);

    // 5. Create Appointments
    // Parse patient 1 for linking
    const p1 = await prisma.patient.findFirst({ where: { email: 'ana@example.com', organizationId: org.id } });

    if (p1) {
        const today = new Date();
        await prisma.appointment.create({
            data: {
                organizationId: org.id,
                patientId: p1.id,
                professionalId: professional.id,
                startTime: new Date(today.setHours(14, 0, 0)),
                endTime: new Date(today.setHours(14, 30, 0)),
                status: 'confirmed',
                procedureName: 'Consulta Inicial',
                duration: 30
            }
        });
        console.log(`📅 Created demo appointment.`);
    }

    console.log('✅ Seed finished successfully.');
}

main()
    .catch((e) => {
        console.error("❌ Seed Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
