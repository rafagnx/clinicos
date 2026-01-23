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
    };

    admin: {
        listOrganizations: () => Promise<any[]>;
    };

    storage: {
        upload: (file: File) => Promise<string>;
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
        FinancialTransaction: EntityHandler;
        [key: string]: EntityHandler;
    };
}

export declare const base44: Base44Client;
