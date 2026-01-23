import { AbilityBuilder, CreateAbility, MongoAbility, createMongoAbility } from '@casl/ability';
import { User, Member, Role } from '@prisma/client';

type AppAbility = MongoAbility<[string, 'Organization' | 'Project' | 'User' | 'Billing' | 'Professional' | 'Patient' | 'Appointment' | 'all']>;

export const createAppAbility = (user: User, membership: Member) => {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (membership.role === 'ADMIN') {
        can('manage', 'all');
        cannot('transfer_ownership', 'Organization', { ownerId: { $ne: user.id } });
    }

    if (membership.role === 'MEMBER') {
        can('read', 'User');
        can('read', 'Project');
        can('create', 'Project');
        can(['update', 'delete'], 'Project', { ownerId: user.id });

        // ClinicOS Logic
        can(['read', 'create', 'update'], 'Professional');
        can(['read', 'create', 'update'], 'Patient');
        can(['read', 'create', 'update'], 'Appointment');
    }

    if (membership.role === 'BILLING') {
        can('manage', 'Billing');
    }

    return build();
};
