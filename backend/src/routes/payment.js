import { Hono } from 'hono';
import qs from 'qs';
import dateFormat from 'dateformat';
import crypto from 'crypto';

const payment = new Hono();

/**
 * Utility to sort object keys (VNPay requirement)
 */
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[decodeURIComponent(str[key])] = obj[decodeURIComponent(str[key])];
    }
    return sorted;
}

/**
 * Helper to get date string in yyyymmddHHmmss format for ICT (GMT+7)
 */
function getVnpDate(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(date);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('year')}${map.get('month')}${map.get('day')}${map.get('hour')}${map.get('minute')}${map.get('second')}`;
}

payment.post('/create_payment_url', async (c) => {
    try {
        const ipAddr = c.req.header('x-forwarded-for') || 
                       c.req.header('remote-addr') || 
                       '127.0.0.1';

        const tmnCode = process.env.VNP_TMNCODE?.trim();
        const secretKey = process.env.VNP_HASHSECRET?.trim();
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURNURL;

        const date = new Date();
        const createDate = getVnpDate(date);
        
        // More unique TxnRef
        const orderId = `${Math.floor(Date.now() / 1000)}-${Math.floor(Math.random() * 1000)}`;

        const body = await c.req.json();
        const amount = body.amount;
        const bankCode = body.bankCode || '';
        
        // Use a very simple slug for orderInfo to avoid encoding issues for now
        const tierName = body.tierName || 'Subscription';
        const orderInfo = `Questly_${tierName.replace(/\s+/g, '_')}_${orderId}`;
        
        const orderType = body.orderType || 'billpayment';
        let locale = body.language || 'vn';
        
        const currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = orderType;
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        if (bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        // Standard VNPay 2.1.0: Sign the encoded string
        // We'll try both encoded and unencoded if this fails.
        let signData = qs.stringify(vnp_Params, { encode: true });
        
        // Ensure we're using sha512
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
        vnp_Params['vnp_SecureHash'] = signed;
        
        const finalUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: true });

        console.log(`[PAYMENT] Order: ${orderId} | Amount: ${amount}`);
        console.log(`[PAYMENT] SignString: ${signData}`);
        return c.json({ paymentUrl: finalUrl });
    } catch (err) {
        console.error('[PAYMENT] Error creating URL:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * Handle VNPay return/callback
 */
payment.get('/vnpay_return', async (c) => {
    try {
        let vnp_Params = c.req.query();
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = process.env.VNP_HASHSECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        const isSignatureValid = (secureHash === signed);
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const status = isSignatureValid ? (responseCode === '00' ? 'success' : 'failed') : 'invalid_signature';
        
        console.log(`[PAYMENT] Return Order ${vnp_Params['vnp_TxnRef']} | Status: ${status} | Code: ${responseCode}`);

        // Redirect back to frontend with status
        const frontendUrl = process.env.VNP_FRONTEND_URL || 'http://localhost:5173/payment-result';
        return c.redirect(`${frontendUrl}?status=${status}&orderId=${vnp_Params['vnp_TxnRef']}&code=${responseCode}`);
    } catch (err) {
        console.error('[PAYMENT] Error handling return:', err);
        return c.text('Error processing payment callback');
    }
});

export default payment;
