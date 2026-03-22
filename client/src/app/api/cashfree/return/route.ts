import { NextRequest, NextResponse } from 'next/server';

/**
 * Cashfree Subscription Return URL Handler
 * 
 * WHY THIS EXISTS:
 * After a successful payment, Cashfree redirects the user back to the return_url
 * via a POST request (not GET). Next.js pages only handle GET requests, so sending
 * Cashfree's POST directly to /dashboard causes a 405 (Method Not Allowed) error.
 * 
 * This Route Handler accepts the POST from Cashfree, and redirects the user
 * to the dashboard via a 303 GET redirect.
 */

// Handle POST from Cashfree subscription redirect
export async function POST(request: NextRequest) {
  try {
    // Try to read Cashfree's POST body (they send form-encoded data)
    let cfStatus = '';
    try {
      const formData = await request.formData();
      cfStatus = (formData.get('cf_checkoutStatus') || formData.get('cf_status') || '').toString();
    } catch {
      // Body might be JSON or empty — that's okay
      try {
        const body = await request.json();
        cfStatus = body?.cf_checkoutStatus || body?.cf_status || '';
      } catch {
        // No parseable body — default to success
      }
    }

    // Determine success or failure based on Cashfree's status
    const successStatuses = ['ACTIVE', 'SUCCESS', 'BANK_APPROVAL_PENDING', 'SUCCESS_DEBIT_PENDING', 'SUCCESS_TOKENIZATION_PENDING'];
    const isSuccess = !cfStatus || successStatuses.includes(cfStatus.toUpperCase());

    // Build the redirect URL
    const baseUrl = request.nextUrl.origin;
    const redirectUrl = isSuccess
      ? `${baseUrl}/dashboard?tab=subscription&success=true`
      : `${baseUrl}/dashboard?tab=subscription&canceled=true`;

    // 303 See Other is the correct status for POST → GET redirect
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error('[Cashfree Return] Error processing return:', error);
    // Even on error, redirect to dashboard so the user isn't stranded
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=subscription&success=true`, { status: 303 });
  }
}

// Also handle GET in case user navigates here directly or bookmarks it
export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/dashboard?tab=subscription&success=true`, { status: 303 });
}
