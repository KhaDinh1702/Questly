import { Hono } from 'hono';
import qs from 'qs';
import dateFormat from 'dateformat';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toObjectId } from '../helpers/db.js';
import { createSubscriptionDocument } from '../models/Subscription.js';
import { grantSubscriptionRewards } from '../services/rewardService.js';
import { getEnv } from '../config/env.js';

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

payment.post('/create_payment_url', requireAuth, async (c) => {
    try {
        const db = await getDb(c);
        const user = c.get('user');

        const ipAddr = c.req.header('x-forwarded-for') ||
            c.req.header('remote-addr') ||
            '127.0.0.1';

        const tmnCode = getEnv(c, 'VNP_TMNCODE')?.trim();
        const secretKey = getEnv(c, 'VNP_HASHSECRET')?.trim();
        const vnpUrl = getEnv(c, 'VNP_URL');
        const returnUrl = getEnv(c, 'VNP_RETURNURL');

        if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
            console.error('[PAYMENT] Missing VNPay configuration:', { tmnCode: !!tmnCode, secretKey: !!secretKey, vnpUrl: !!vnpUrl, returnUrl: !!returnUrl });
            throw new Error('VNPay configuration missing in environment');
        }

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

        // Standard VNPay 2.1.0: Sign the string WITHOUT encoding values
        let signData = qs.stringify(vnp_Params, { encode: false });

        // Ensure we're using sha512
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;

        const finalUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: true });

        // Save order to DB so we can update user tier upon callback
        await db.collection('orders').insertOne({
            orderId,
            userId: user.id,
            tierName,
            amount,
            status: 'pending',
            createdAt: new Date()
        });

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
        const db = await getDb(c);
        let vnp_Params = c.req.query();
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = getEnv(c, 'VNP_HASHSECRET');
        if (!secretKey) {
            console.error('[PAYMENT] VNP_HASHSECRET missing in callback');
            throw new Error('VNP_HASHSECRET missing');
        }
        
        // VNPay 2.1.0: Sort parameters and ensure no empty values are included in hashing
        // This is critical for signature matching
        for (let key in vnp_Params) {
            if (vnp_Params[key] === '' || vnp_Params[key] === null || vnp_Params[key] === undefined) {
                delete vnp_Params[key];
            }
        }

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        const isSignatureValid = (secureHash === signed);
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const status = isSignatureValid ? (responseCode === '00' ? 'success' : 'failed') : 'invalid_signature';

        const orderId = vnp_Params['vnp_TxnRef'];
        console.log(`[PAYMENT] Return Order ${orderId} | Status: ${status} | Code: ${responseCode}`);

        if (status === 'success') {
            const order = await db.collection('orders').findOne({ orderId });
            if (order && order.status === 'pending') {
                // Update order
                await db.collection('orders').updateOne({ orderId }, { $set: { status: 'success' } });

                // Keep naming simple: match the frontend names with subscription Tier names if possible,
                // otherwise just set it to 'monthly' or what was purchased.
                // Assuming tierName comes in as something like 'Monthly', 'Yearly', etc.
                const tierName = order.tierName || '';
                let mappedTier = tierName === 'Legend' ? 'yearly'
                    : tierName === 'Knight' ? '6months'
                        : 'monthly';

                let durationDays = 30;
                if (mappedTier === 'yearly') durationDays = 365;
                else if (mappedTier === '6months') durationDays = 180;

                const userDoc = await db.collection('users').findOne({ _id: toObjectId(order.userId) });
                const now = new Date();

                let subStartDate = now;
                let subEndDate = new Date(now);
                subEndDate.setDate(now.getDate() + durationDays);

                if (userDoc && userDoc.subExpiryDate && userDoc.subExpiryDate > now) {
                    // Extension case
                    subStartDate = new Date(userDoc.subExpiryDate);
                    subEndDate = new Date(subStartDate);
                    subEndDate.setDate(subEndDate.getDate() + durationDays);
                }

                const subDoc = createSubscriptionDocument({
                    userId: order.userId,
                    tier: mappedTier,
                    amount: order.amount,
                    orderId: order.orderId,
                    durationDays
                });
                // Overwrite calculated dates in subDoc if it's an extension
                subDoc.startDate = subStartDate;
                subDoc.endDate = subEndDate;

                await db.collection('subscriptions').insertOne(subDoc);

                // Tier Priority: yearly (3) > 6months (2) > monthly (1) > free (0)
                const TIER_PRIORITY = { 'free': 0, 'monthly': 1, '6months': 2, 'yearly': 3 };
                let finalTier = mappedTier;
                if (userDoc && TIER_PRIORITY[userDoc.subscriptionTier || 'free'] > TIER_PRIORITY[mappedTier]) {
                    finalTier = userDoc.subscriptionTier || 'free';
                }

                await db.collection('users').updateOne(
                    { _id: toObjectId(order.userId) },
                    {
                        $set: {
                            subscriptionTier: finalTier,
                            subExpiryDate: subEndDate,
                            updatedAt: new Date()
                        }
                    }
                );
                console.log(`[PAYMENT] Updated user ${order.userId} to tier ${finalTier}`);

                // Grant rewards (Grade B set, Grade S scrolls, etc.)
                try {
                    await grantSubscriptionRewards(db, order.userId, mappedTier);
                } catch (rewardErr) {
                    console.error(`[PAYMENT] Error granting rewards for user ${order.userId}:`, rewardErr);
                }
            }
        }

        // Redirect back to frontend with status
        const frontendUrl = getEnv(c, 'VNP_FRONTEND_URL') || 'http://localhost:5173/payment-result';
        return c.redirect(`${frontendUrl}?status=${status}&orderId=${orderId}&code=${responseCode}`);
    } catch (err) {
        console.error('[PAYMENT] Error handling return:', err);
        return c.text('Error processing payment callback');
    }
});

export default payment;
