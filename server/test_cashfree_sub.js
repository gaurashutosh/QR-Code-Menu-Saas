import 'dotenv/config';
import axios from 'axios';
import crypto from 'crypto';

const cashfree = axios.create({
  baseURL: 'https://sandbox.cashfree.com/pg',
  headers: {
    'x-client-id': process.env.CASHFREE_CLIENT_ID,
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
  },
});

async function run() {
  try {
    const subscriptionId = 'sub_' + crypto.randomBytes(12).toString('hex');
    const req = {
      subscription_id: subscriptionId,
      plan_details: {
        plan_id: 'premium_monthly' // Use a plan ID that likely exists
      },
      customer_details: {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '9999999999'
      },
      subscription_meta: {
        return_url: 'http://localhost:3000/dashboard?tab=subscription&success=true'
      }
    };
    
    console.log('Creating subscription:', subscriptionId);
    const response = await cashfree.post('/subscriptions', req);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

run();
