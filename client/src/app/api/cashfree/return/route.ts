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
    // On unexpected error, redirect to dashboard with a pending status so UI can verify
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=subscription&success=pending`, { status: 303 });
  }
}

// Also handle GET in case user navigates here directly or via a standard redirect
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  
  // Inspect incoming params to see if it's a valid successful return
  const cfStatus = searchParams.get('cf_status') || searchParams.get('cf_checkoutStatus') || '';
  const successStatuses = ['ACTIVE', 'SUCCESS', 'BANK_APPROVAL_PENDING', 'SUCCESS_DEBIT_PENDING', 'SUCCESS_TOKENIZATION_PENDING'];
  
  // If we have status and it's successful, or if it's a known success identifier
  const isSuccess = cfStatus && successStatuses.includes(cfStatus.toUpperCase());

  let redirectPath = '/dashboard?tab=subscription';
  if (isSuccess) {
    redirectPath += '&success=true';
  } else if (cfStatus) {
    // If we have a status but it's not success, it's likely a cancel or failure
    redirectPath += '&canceled=true';
  }
  // If no params at all (direct access), just go to the tab basic

  return NextResponse.redirect(`${origin}${redirectPath}`, { status: 303 });
}
