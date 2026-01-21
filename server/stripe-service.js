import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16', // Use latest API version
});

const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'https://clinicosapp.vercel.app'; // Or localhost in dev

export const stripeService = {
    /**
     * Create a Checkout Session for a subscription with trial
     */
    createCheckoutSession: async (organizationId, userEmail, priceId) => {
        try {
            // 1. Create Checkout Session
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId || process.env.STRIPE_PRICE_ID, // Plan Price ID from Stripe Dashboard
                        quantity: 1,
                    },
                ],
                subscription_data: {
                    trial_period_days: 7, // 7 Days Free Trial
                    metadata: {
                        organizationId: organizationId
                    }
                },
                customer_email: userEmail, // Pre-fill email
                client_reference_id: organizationId,
                success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${FRONTEND_URL}/billing/cancel`,
                metadata: {
                    organizationId: organizationId
                }
            });

            return session;
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    },

    /**
     * Create a Customer Portal Session (for users to manage billing)
     */
    createPortalSession: async (customerId) => {
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: `${FRONTEND_URL}/ClinicSettings`,
            });
            return session;
        } catch (error) {
            console.error('Error creating portal session:', error);
            throw error;
        }
    },

    /**
     * Handle Stripe Webhooks
     */
    handleWebhook: async (signature, body, pool) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error(`Webhook signature verification failed.`, err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        // Handle the events
        switch (event.type) {
            case 'checkout.session.completed':
                // Subscription created successfully
                const session = event.data.object;
                await handleCheckoutCompleted(session, pool);
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                // Status changed (trial ended, payment failed, canceled)
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription, pool);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
};

// --- Helper Functions for Database Updates ---

async function handleCheckoutCompleted(session, pool) {
    const organizationId = session.client_reference_id || session.metadata?.organizationId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!organizationId) {
        console.error('No organizationId found in session metadata');
        return;
    }

    // Update Organization in DB
    try {
        const query = `
            UPDATE organization 
            SET 
                stripe_customer_id = $1,
                stripe_subscription_id = $2,
                subscription_status = 'trialing',
                trial_ends_at = NOW() + INTERVAL '7 days'
            WHERE id = $3
        `;
        await pool.query(query, [customerId, subscriptionId, organizationId]);
        console.log(`Organization ${organizationId} subscription activated (trial).`);
    } catch (err) {
        console.error('Error updating organization subscription:', err);
    }
}

async function handleSubscriptionUpdated(subscription, pool) {
    const customerId = subscription.customer;
    const status = subscription.status; // active, past_due, canceled, trialing
    const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

    try {
        // We find the org by customer_id
        const query = `
            UPDATE organization 
            SET 
                subscription_status = $1,
                trial_ends_at = $2
            WHERE stripe_customer_id = $3
        `;
        // Note: For 'active' status (paid), trial_ends_at might be null or past.
        // If status is 'active', it means trial is over and they paid.

        await pool.query(query, [status, trialEndsAt, customerId]);
        console.log(`Updated subscription status for customer ${customerId} to ${status}`);
    } catch (err) {
        console.error('Error updating subscription status:', err);
    }
}
