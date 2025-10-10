export class CollaboratorNotFoundError extends Error {
  constructor() {
    super('Collaborator not found.')
  }
}
