/**
 * gardens collection schema
 * One document per user, with an array of garden plots.
 */

export function createGardenDocument({ userId }) {
  return {
    userId,
    plots: [],    // see GardenPlot shape below
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Shape of a single garden plot (embedded in gardens.plots[]):
 * {
 *   plotIndex: number,    // 0-based position
 *   seedId: ObjectId | null,     // reference to items collection (type=seed)
 *   plantedAt: Date | null,
 *   readyAt: Date | null,        // plantedAt + dungeon laps × timerMultiplier
 *   harvested: boolean,
 * }
 */
export function createPlot(plotIndex) {
  return {
    plotIndex,
    seedId: null,
    plantedAt: null,
    readyAt: null,
    harvested: false,
  }
}

/**
 * Calculate harvest time.
 * Each dungeon move lap = 1 hour in garden time.
 * Higher-tier seeds take more laps.
 *
 * @param {Date} plantedAt
 * @param {number} dungeonLaps  - e.g. 5 dungeon moves = 5/24 of a day
 * @returns {Date}
 */
export function calcReadyAt(plantedAt, dungeonLaps) {
  const msPerLap = 60 * 60 * 1000  // 1 hour per lap
  return new Date(plantedAt.getTime() + dungeonLaps * msPerLap)
}

export const gardenIndexes = [
  { key: { userId: 1 }, options: { unique: true } },
]
