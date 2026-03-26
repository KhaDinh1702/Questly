/**
 * subscriptions collection schema (billing / pricing)
 * Stored when VNPay payment succeeds.
 */
import { toObjectId } from '../helpers/db.js'

export function createSubscriptionDocument({
  userId,       // string userId (ObjectId string)
  tier,         // 'monthly' | '6months' | 'yearly' | 'free'
  amount = 0,   // VND
  orderId,      // VNPay orderId (TxnRef)
  durationDays = 30,
}) {
  const now = new Date()
  const _userId = toObjectId(userId)
  const startDate = now
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + Math.max(1, Number(durationDays) || 30))

  return {
    userId: _userId,     // ObjectId
    tier,
    amount,
    orderId,
    durationDays,
    startDate,
    endDate,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

