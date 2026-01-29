import { FastifyRequest } from 'fastify';
import { User, Member } from '@prisma/client';
import { MongoAbility } from '@casl/ability';
import { AbilityTuple, MongoQuery } from '@casl/ability/dist/types';

// App Ability Type (Should match permissions.ts)
type AppAbility = MongoAbility<[string, 'Organization' | 'Project' | 'User' | 'Billing' | 'Professional' | 'Patient' | 'Appointment' | 'all']>;

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
        member?: Member;
        ability?: AppAbility;
    }
}
