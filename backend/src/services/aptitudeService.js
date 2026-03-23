/**
 * Aptitude Test service
 * Handles test session creation, scoring, and reward distribution.
 */

import { ObjectId } from 'mongodb'
import { toObjectId } from '../helpers/db'
import { calcAptitudeReward, calcTicketReward, convertTicketsToMoves } from '../helpers/gameLogic'
import { addResources, useAptitudeTestSlot } from './userService'

/**
 * Start an aptitude test session.
 * Pulls N random flashcards from the user's public grimoire + all public sets.
 *
 * @param {object} db
 * @param {string} userId
 * @param {number} questionCount - default 10
 * @returns {{ ok, questions?, reason? }}
 */
export async function startAptitudeTest(db, userId, questionCount = 10) {
  // Check and consume a daily test slot
  const slot = await useAptitudeTestSlot(db, userId)
  if (!slot.ok) return slot

  // Pull random cards from public flashcard sets
  const cards = await db.collection('flashcard_sets')
    .aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$cards' },
      { $sample: { size: questionCount } },
      { $project: { term: '$cards.term', definition: '$cards.definition', setId: '$_id', _id: 0 } },
    ])
    .toArray()

  return { ok: true, questions: cards, remainingTests: slot.remainingTests }
}

/**
 * Submit aptitude test answers and distribute rewards.
 *
 * @param {object}   db
 * @param {string}   userId
 * @param {number}   totalQuestions
 * @param {number}   correctAnswers
 * @param {boolean}  isMultiChoice     - toggles ticket sub-system
 * @returns {{ ok, moves, gold, tickets, totalScore }}
 */
export async function submitAptitudeTest(db, userId, { totalQuestions, correctAnswers, isMultiChoice = false }) {
  if (totalQuestions <= 0) return { ok: false, reason: 'Invalid question count' }

  const correctPct = Math.round((correctAnswers / totalQuestions) * 100)

  let moves = 0, gold = 0, tickets = 0

  if (isMultiChoice) {
    // Ticket sub-system: earn tickets per question, convert to moves
    tickets = calcTicketReward(correctPct)

    // Fetch current ticket balance and convert
    const user = await db.collection('users').findOne(
      { _id: toObjectId(userId) },
      { projection: { ticketCount: 1 } },
    )
    const totalTickets = (user?.ticketCount ?? 0) + tickets
    const converted = convertTicketsToMoves(totalTickets)
    moves = converted.moves

    // Update ticket balance (reduce by used tickets)
    const usedTickets = tickets - converted.remainingTickets + (user?.ticketCount ?? 0) - converted.remainingTickets
    await addResources(db, userId, {
      tickets: tickets - (totalTickets - converted.remainingTickets),
      dungeonMoves: moves,
    })
  } else {
    // Standard mode
    const reward = calcAptitudeReward(correctPct)
    moves = reward.moves
    gold  = reward.gold
    if (moves > 0 || gold > 0) {
      await addResources(db, userId, { gold, dungeonMoves: moves })
    }
  }

  return { ok: true, correctPct, moves, gold, tickets }
}
