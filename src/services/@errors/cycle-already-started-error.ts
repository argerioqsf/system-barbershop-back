export class CycleAlreadyStarted extends Error {
  constructor() {
    super('A cycle has already started')
  }
}
