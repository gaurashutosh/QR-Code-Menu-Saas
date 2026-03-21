declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    returnUrl?: string;
  }

  interface CashfreeCheckoutResult {
    error?: {
      message: string;
      code?: string;
    };
    paymentDetails?: Record<string, unknown>;
  }

  interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  interface LoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance | null>;
}
