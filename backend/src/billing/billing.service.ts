import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);
  private readonly priceBasic: string;
  private readonly pricePro: string;
  private readonly frontendUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY', '');
    this.stripe = new Stripe(secretKey);
    this.priceBasic = this.config.get<string>('STRIPE_PRICE_BASIC', '');
    this.pricePro = this.config.get<string>('STRIPE_PRICE_PRO', '');
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  async createCheckoutSession(userId: string, priceId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Resolve the actual Stripe price ID
    const resolvedPriceId = this.resolvePriceId(priceId);

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/settings/billing?success=true`,
      cancel_url: `${this.frontendUrl}/settings/billing?canceled=true`,
      metadata: { userId },
    });

    return session.url!;
  }

  async createPortalSession(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.stripeCustomerId) {
      throw new BadRequestException('Nincs Stripe fiok hozzarendelve');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl}/settings/billing`,
    });

    return session.url;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.metadata?.userId) {
          const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          const tier = this.mapPriceToTier(priceId);
          await this.prisma.user.update({
            where: { id: session.metadata.userId },
            data: { subscriptionTier: tier },
          });
          this.logger.log(`User ${session.metadata.userId} upgraded to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const tier = this.mapPriceToTier(priceId);
        const user = await this.prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { subscriptionTier: tier },
          });
          this.logger.log(`User ${user.id} subscription updated to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await this.prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { subscriptionTier: 'free' },
          });
          this.logger.log(`User ${user.id} subscription canceled, reverted to free`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private resolvePriceId(priceId: string): string {
    switch (priceId) {
      case 'basic':
        return this.priceBasic;
      case 'pro':
        return this.pricePro;
      default:
        return priceId; // Allow passing actual Stripe price IDs directly
    }
  }

  private mapPriceToTier(priceId: string): string {
    if (priceId === this.priceBasic) return 'basic';
    if (priceId === this.pricePro) return 'pro';
    return 'free';
  }
}
