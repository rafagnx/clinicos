export interface Base44Client {
    read: (entity: string, params?: any) => Promise<any[]>;
    create: (entity: string, data: any) => Promise<any>;
    update: (entity: string, id: string | number, data: any) => Promise<any>;
    delete: (entity: string, id: string | number) => Promise<any>;

    auth: {
        me: () => Promise<any>;
    };

    admin: {
        listOrganizations: () => Promise<any[]>;
    };

    entities: {
        [key: string]: {
            list: (params?: any) => Promise<any[]>;
            get: (id: string | number) => Promise<any>;
            create: (data: any) => Promise<any>;
            update: (id: string | number, data: any) => Promise<any>;
            delete: (id: string | number) => Promise<any>;
        }
    };

    // Legacy accessors
    professional: any;
    appointment: any;
    patient: any;
}

export declare const base44: Base44Client;
