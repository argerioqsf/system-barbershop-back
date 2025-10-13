export class PlanNotFromUserUnitError extends Error {
  constructor() {
    super('Plan does not belong to the current unit')
  }
}
