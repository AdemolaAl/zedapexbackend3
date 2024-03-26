const axios = require('axios');


const flutterwaveSecretKey = 'YOUR_FLUTTERWAVE_SECRET_KEY';

async function initiatePayment(amount, email, callbackUrl) {
    try {
        const response = await axios.post('https://api.flutterwave.com/v3/payments', {
            tx_ref: 'unique_transaction_reference', // Generate a unique transaction reference
            amount: amount,
            currency: 'NGN', // Currency code (e.g., NGN for Nigerian Naira)
            payment_options: 'card', // Payment method (e.g., card)
            redirect_url: callbackUrl,
            customer: {
                email: email,
            },
            customizations: {
                title: 'Your App Name',
                description: 'Payment for services',
            },
        }, {
            headers: {
                'Authorization': `Bearer ${flutterwaveSecretKey}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data.data;
    } catch (error) {
        console.error('Error initiating payment:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Example usage
initiatePayment(5000, 'customer@example.com', 'https://yourwebsite.com/callback')
    .then(paymentData => {
        console.log('Payment initiated:', paymentData);
        // Redirect user to payment URL (paymentData.link)
    })
    .catch(error => {
        console.error('Payment initiation failed:', error);
    });
