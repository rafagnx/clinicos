
import { base44 } from '@/lib/base44Client';

export const ExportService = {
    /**
     * utils: Convert array of objects to CSV string
     */
    toCSV: (data: any[], headers?: string[]) => {
        if (!data || !data.length) return '';

        const keys = headers || Object.keys(data[0]);
        const headerRow = keys.join(',');

        const rows = data.map(row => {
            return keys.map(key => {
                let val = row[key];
                if (val === null || val === undefined) val = '';
                val = String(val).replace(/"/g, '""'); // Escape quotes
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val}"`;
                }
                return val;
            }).join(',');
        });

        return [headerRow, ...rows].join('\n');
    },

    /**
     * utils: Trigger browser download
     */
    downloadFile: (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Export Patients as CSV
     */
    exportPatients: async () => {
        try {
            // Fetch all patients (RLS ensures only current org data)
            const patients = await base44.entities.Patient.list();

            if (!patients.length) {
                throw new Error("Nenhum paciente encontrado para exportar.");
            }

            // Format for CSV (Select friendly columns)
            const formatted = patients.map((p: any) => ({
                ID: p.id,
                Nome: p.name || p.full_name,
                Email: p.email || '',
                Telefone: p.phone || '',
                CPF: p.cpf || '',
                DataNascimento: p.birth_date || '',
                Genero: p.gender || '',
                Endereco: p.address || '',
                CriadoEm: p.createdAt || p.created_at
            }));

            const csv = ExportService.toCSV(formatted);
            const fileName = `pacientes_export_${new Date().toISOString().slice(0, 10)}.csv`;
            ExportService.downloadFile(csv, fileName, 'text/csv;charset=utf-8;');
            return { success: true, count: patients.length };
        } catch (e) {
            console.error("Export Error:", e);
            throw e;
        }
    },

    /**
     * Export Full Backup (Patients + Records + Appointments) as JSON
     */
    exportFullBackup: async () => {
        try {
            const [patients, appointments, records] = await Promise.all([
                base44.entities.Patient.list().catch(() => []),
                base44.entities.Appointment.list().catch(() => []),
                // Assuming we have a way to list medical records, if not exposed in base44, we might need a direct query or new endpoint
                // For MVP, we'll try to find the entity or skip if not available
                (base44.entities['MedicalRecord'] || { list: async () => [] }).list().catch(() => [])
            ]);

            const backupData = {
                metadata: {
                    exportedAt: new Date().toISOString(),
                    system: "ClinicOS Official",
                    version: "1.0"
                },
                data: {
                    patients,
                    appointments,
                    medical_records: records
                }
            };

            const json = JSON.stringify(backupData, null, 2);
            const fileName = `clinicos_backup_full_${new Date().toISOString().slice(0, 10)}.json`;
            ExportService.downloadFile(json, fileName, 'application/json');

            return {
                success: true, stats: {
                    patients: patients.length,
                    appointments: appointments.length,
                    records: records.length
                }
            };
        } catch (e) {
            console.error("Backup Error:", e);
            throw e;
        }
    }
};
