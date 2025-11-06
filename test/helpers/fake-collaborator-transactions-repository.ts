import {
  CollaboratorTransaction,
  CollaboratorTransactionsRepository,
} from '../../src/modules/collaborator/application/ports/collaborator-transactions-repository'

export class FakeCollaboratorTransactionsRepository
  implements CollaboratorTransactionsRepository
{
  transactions: CollaboratorTransaction[] = []

  async findManyByCollaborator(
    collaboratorId: string,
  ): Promise<CollaboratorTransaction[]> {
    return this.transactions.filter((transaction) => {
      return (
        transaction.affectedUser?.id === collaboratorId ||
        transaction.user?.id === collaboratorId
      )
    })
  }
}
