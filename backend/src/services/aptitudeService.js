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
export async function startAptitudeTest(db, userId, questionCount = 10, setId = null) {
  // Check slot — always proceeds, rewardEligible flags whether rewards apply
  const slot = await useAptitudeTestSlot(db, userId)
  if (!slot.ok) return slot  // only fails if user not found

  const userObjectId = toObjectId(userId)
  const dbUser = await db.collection('users').findOne({ _id: userObjectId })
  const acquiredIds = dbUser?.acquiredGrimoires || []

  let cards = []

  if (setId) {
    const targetId = toObjectId(setId)
    cards = await db.collection('flashcard_sets')
      .aggregate([
        { $match: { _id: targetId } },
        { $unwind: '$cards' },
        { $sample: { size: questionCount } },
        { $project: { term: '$cards.term', definition: '$cards.definition', setId: '$_id', _id: 0 } },
      ])
      .toArray()
  }

  if (cards.length === 0) {
    cards = await db.collection('flashcard_sets')
      .aggregate([
        { $match: { $or: [{ creatorId: userObjectId }, { _id: { $in: acquiredIds } }] } },
        { $unwind: '$cards' },
        { $sample: { size: questionCount } },
        { $project: { term: '$cards.term', definition: '$cards.definition', setId: '$_id', _id: 0 } },
      ])
      .toArray()
  }

  if (cards.length === 0) {
    cards = await db.collection('flashcard_sets')
      .aggregate([
        { $match: { isPublic: true } },
        { $unwind: '$cards' },
        { $sample: { size: questionCount } },
        { $project: { term: '$cards.term', definition: '$cards.definition', setId: '$_id', _id: 0 } },
      ])
      .toArray()
  }

  // Generate options for each card
  const allDefinitions = cards.map(c => c.definition)
  const questions = cards.map(c => {
    // Pick 3 random definitions from the pool (excluding the correct one)
    const otherDefs = allDefinitions.filter(d => d !== c.definition)
    const wrongAnswers = otherDefs.sort(() => 0.5 - Math.random()).slice(0, 3)
    const options = [c.definition, ...wrongAnswers].sort(() => 0.5 - Math.random())
    return {
      term: c.term,
      options,
      correctOption: c.definition, // Kept here so client can easily validate. Should ideally be hidden in production.
      setId: c.setId
    }
  })

  return { ok: true, questions, rewardEligible: slot.rewardEligible, remainingTests: slot.remainingTests }
}

/**
 * Submit aptitude test answers and distribute rewards.
 *
 * @param {object}   db
 * @param {string}   userId
 * @param {number}   totalQuestions
 * @param {number}   correctAnswers
 * @param {boolean}  isMultiChoice     - toggles ticket sub-system
 * @returns {{ ok, turns, moves, gold, tickets, totalScore }}
 */
export async function submitAptitudeTest(db, userId, { totalQuestions, correctAnswers, rewardEligible = true }) {
  if (totalQuestions <= 0) return { ok: false, reason: 'Invalid question count' }

  const correctPct = Math.round((correctAnswers / totalQuestions) * 100)

  let moves = 0, gold = 0, tickets = 0

  if (rewardEligible) {
    if (correctPct >= 50) {
      moves = Math.floor(correctPct / 10)
      const stepsAbove50 = Math.floor((correctPct - 50) / 10)
      gold = 3 + (stepsAbove50 * 2)
    }
    if (correctPct === 100) tickets = 2
    else if (correctPct >= 85) tickets = 1

    if (moves > 0 || gold > 0 || tickets > 0) {
      await addResources(db, userId, { gold, dungeonMoves: moves, tickets })
    }
  }

  return { ok: true, correctPct, turns: moves, moves, gold, tickets, rewardEligible }
}
