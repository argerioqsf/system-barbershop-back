export class WorkHourOutsideOpeningHoursError extends Error {
  constructor() {
    super('Hour outside unit opening hours')
  }
}
