import { toast } from 'svelte-sonner';

// Declare Razorpay interface for TypeScript
interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    modal: {
        ondismiss: () => void;
    };
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color: string;
    };
    mode?: string;
}

interface Razorpay {
    new (options: RazorpayOptions): { open: () => void; on: (event: string, callback: (response: any) => void) => void };
}

declare global {
    interface Window {
        Razorpay: Razorpay;
    }
}

export function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            console.log('Razorpay SDK already loaded');
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            console.log('Razorpay SDK loaded successfully');
            resolve(true);
        };
        script.onerror = () => {
            console.error('Failed to load Razorpay SDK');
            reject(new Error('Failed to load Razorpay SDK'));
        };
        document.body.appendChild(script);
    });
}

export async function initiatePayment({
    order,
    onSuccess,
    onFailure,
    customerName = '',
    customerContact = ''
}: {
    order: { id: string; amount: number; currency: string };
    onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    onFailure: (error: { description: string }) => void;
    customerName?: string;
    customerContact?: string;
}) {
    try {
        // Ensure Razorpay SDK is loaded
        await loadRazorpay();

        if (!window.Razorpay) {
            throw new Error('Razorpay SDK not available after loading');
        }

        // Use environment variable for Razorpay Key ID
        const RAZORPAY_KEY = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY;
        if (!RAZORPAY_KEY || !RAZORPAY_KEY.startsWith('rzp_')) {
            throw new Error('Invalid or missing Razorpay Test Key ID. Please set VITE_PUBLIC_RAZORPAY_KEY in your .env file with a valid test key (e.g., rzp_test_xxxxxxxxxxxxxx).');
        }

        // Validate order parameters
        if (!order.id || !order.id.startsWith('order_')) {
            throw new Error('Invalid Razorpay order ID');
        }
        if (!order.amount || typeof order.amount !== 'number' || order.amount <= 0) {
            throw new Error('Invalid order amount');
        }
        if (order.currency !== 'INR') {
            throw new Error('Currency must be INR for test mode');
        }

        const options: RazorpayOptions = {
            key: RAZORPAY_KEY,
            amount: order.amount,
            currency: order.currency,
            order_id: order.id,
            mode: 'live', // Explicitly set test mode
            handler: (response) => {
                console.log('Payment success:', response);
                onSuccess(response);
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment modal dismissed');
                    onFailure({ description: 'Payment modal closed by user' });
                }
            },
            prefill: {
                name: customerName || 'Customer',
                contact: customerContact || ''
            },
            theme: {
                color: '#01A0E2'
            }
        };

        console.log('Razorpay options:', {
            key: RAZORPAY_KEY,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            mode: 'live'
        });

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: { error: { description: string } }) => {
            console.error('Payment failed:', response.error);
            onFailure({ description: response.error.description || 'Payment failed' });
        });

        rzp.open();
    } catch (error: any) {
        console.error('Payment initiation error:', error);
        onFailure({ description: error.message || 'Failed to initiate payment' });
        toast.error(error.message || 'Failed to initiate payment');
    }
}