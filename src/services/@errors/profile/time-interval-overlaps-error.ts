export class TimeIntervalOverlapsError extends Error {
  constructor() {
    super('This time interval overlaps another')
  }
}
