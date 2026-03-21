declare module '@cashfreepayments/cashfree-js' {
  // For one-time payment orders
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    returnUrl?: string;
    redirectTarget?: string;
  }

  // For subscription checkout
  interface CashfreeSubscriptionCheckoutOptions {
    subsSessionId: string;
    redirectTarget?: string;
    returnUrl?: string;
  }

  interface CashfreeCheckoutResult {
    error?: {
      message: string;
      code?: string;
    };
    paymentDetails?: Record<string, unknown>;
    redirect?: boolean;
  }

  interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
    subscriptionsCheckout(options: CashfreeSubscriptionCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  interface LoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance | null>;
}
