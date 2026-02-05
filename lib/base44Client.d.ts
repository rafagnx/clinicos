import { AxiosInstance } from 'axios';

export interface EntityHandler {
    list: (params?: any) => Promise<any[]>;
    read: (params?: any) => Promise<any[]>;
    filter: (query: any) => Promise<any[]>;
    create: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
    delete: (id: string | number) => Promise<any>;
}

export interface Base44Client {
    // Generic methods
    list: (entity: string, params?: any) => Promise<any[]>;
    read: (entity: string, params?: any) => Promise<any[]>;
    filter: (entity: string, query: any) => Promise<any[]>;
    create: (entity: string, data: any) => Promise<any>;
    update: (entity: string, id: string | number, data: any) => Promise<any>;
    delete: (entity: string, id: string | number) => Promise<any>;

    auth: {
        me: () => Promise<any>;
        updateMe: (data: any) => Promise<any>;
        logout: () => Promise<void>;
        getUserOrganizations: () => Promise<any[]>;
    };

    admin: {
        listOrganizations: () => Promise<any[]>;
        acceptInvite: (token: string) => Promise<{ data: any; error: any }>;
    };

    storage: {
        upload: (file: File) => Promise<string>;
    };

    blockedDays: {
        list: (params: { professionalId: number; startDate: string; endDate: string }) => Promise<any[]>;
        create: (data: { professionalId: number; startDate: string; endDate: string; reason: string; confirmConflicts?: boolean }) => Promise<any>;
        update: (id: string, data: { reason: string }) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };

    holidays: {
        list: (params?: { year?: number }) => Promise<any[]>;
        create: (data: { date: string; name: string }) => Promise<any>;
        delete: (id: string) => Promise<any>;
        seed: () => Promise<any>;
    };

    entities: {
        Professional: EntityHandler;
        Patient: EntityHandler;
        Appointment: EntityHandler;
        MedicalRecord: EntityHandler;
        Notification: EntityHandler;
        Promotion: EntityHandler;
        Lead: EntityHandler;
        Message: EntityHandler;
        Conversation: EntityHandler;
        ClinicSettings: EntityHandler;
        NotificationPreference: EntityHandler;
        ProcedureType: EntityHandler;
        ProcedureType: EntityHandler;
        FinancialTransaction: EntityHandler;
        TreatmentPlan: EntityHandler;
        TreatmentPlanItem: EntityHandler;
        Campaign: EntityHandler;
        [key: string]: EntityHandler;
    };
}

export declare const base44: Base44Client;
export declare const api: AxiosInstance;
