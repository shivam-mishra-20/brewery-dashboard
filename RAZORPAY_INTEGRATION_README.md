# Razorpay Integration Guide

This guide explains how to set up and configure the Razorpay payment gateway in the WorkBrew Dashboard application.

## Configuration

### Environment Variables

The application requires the following environment variables to be set for Razorpay to function correctly:

```
# Razorpay Configuration Mode ('test' or 'prod')
RAZORPAY_MODE=test

# Test credentials (for test mode)
RAZORPAY_KEY_ID_TEST=rzp_test_your_test_key
RAZORPAY_KEY_SECRET_TEST=your_test_secret

# Production credentials (for prod mode)
RAZORPAY_KEY_ID_PROD=rzp_live_your_live_key
RAZORPAY_KEY_SECRET_PROD=your_live_secret

# Public key exposed to frontend (use the appropriate key based on mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_test_key
```

### Setting Up Test Mode

1. Create a Razorpay account at [https://razorpay.com](https://razorpay.com)
2. Navigate to Dashboard > Settings > API Keys
3. Copy your Test Key ID and Test Secret Key
4. Add them to your `.env.local` file or your hosting platform's environment variables

### Switching to Production

When ready for production:

1. Set `RAZORPAY_MODE=prod` in your environment variables
2. Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` to use your production key

## Testing Payments

In test mode, you can use the following card details:

- Card Number: 4111 1111 1111 1111
- Expiry Date: Any future date
- CVV: Any 3 digits
- Name: Any name

## Payment Flow

1. User adds items to cart
2. User proceeds to checkout
3. User selects payment method (online or cash)
4. For online payments, the Razorpay modal opens
5. After payment, user is redirected to a success page
6. User can view their order status in the orders page

## Implementation Details

The payment integration consists of:

1. **Backend API Routes:**
   - `/api/payment/create-order`: Creates a Razorpay order
   - `/api/payment/verify`: Verifies a payment after completion
   - `/api/orders`: Creates an order in the database

2. **Frontend Services:**
   - `paymentService.ts`: Handles payment processing and order creation

3. **UI Components:**
   - `/payment-success`: Success page after payment
   - `/orders`: Order tracking page

## Troubleshooting

- **Authentication Key Missing:** Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is correctly set
- **Payment Verification Failing:** Check that your secret key is correct
- **Redirect Not Working:** Check the event handlers in `paymentService.ts`
