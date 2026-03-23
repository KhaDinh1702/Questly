/**
 * flashcard_sets collection schema (Quest / Grimoire)
 * Used for the Quizlet-like flashcard feature.
 */

export function createFlashcardSetDocument({
  title,
  description = '',
  creatorId,      // ObjectId → users
  isPublic = true,
  cards = [],     // [{ term, definition, imageUrl }]
}) {
  const now = new Date()
  return {
    title,
    description,
    creatorId,
    isPublic,
    cards: cards.map(({ term, definition, imageUrl = null }) => ({
      term,
      definition,
      imageUrl,
    })),
    studiedCount: 0,   // how many times this set has been studied by others
    createdAt: now,
    updatedAt: now,
  }
}

export const flashcardSetIndexes = [
  { key: { creatorId: 1 } },
  { key: { isPublic: 1, studiedCount: -1 } },  // public sets sorted by popularity
  { key: { title: 'text', description: 'text' } },
]
