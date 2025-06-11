
    const transactions = await this.transactionRepository.findMany()

    const saleTransactions = transactions.filter(
      (t) => t.sale && t.sale.unit.organizationId === orgId,
    )
    let ownerSales = 0
    for (const t of saleTransactions) {
      const sale = t.sale!
      const bases = sale.items.map((item) => ({
        item,
        value: item.total ?? item.service.price * item.quantity,
      }))
      const totalBase = bases.reduce((acc, b) => acc + b.value, 0)
      if (totalBase === 0) continue
      for (const base of bases) {
        const final = (sale.total * base.value) / totalBase
        if (base.item.service.isProduct) {
          ownerSales += final
          const perc =
            base.item.barber?.profile?.commissionPercentage ?? 100
          ownerSales += final - final * (perc / 100)
    }
    const manualTotals = (await this.transactionRepository.findManyByUser(ownerId))
      .filter((t) => !t.sale)
      .reduce(
        (totals, t) => {
          if (t.type === 'ADDITION') totals.additions += t.amount
          else if (t.type === 'WITHDRAWAL') totals.withdrawals += t.amount
          return totals
        },
        { additions: 0, withdrawals: 0 },
      )
    const balance = Number(
      (ownerSales + manualTotals.additions - manualTotals.withdrawals).toFixed(2),
    )

    function setHistory(
      valueService: number,
      percentage: number,
      valuePorcent: number,
      sale: DetailedSale,
    ) {
      if (valueService > 0) {
        historySales.push({
          valueService,
          percentage,
          valueOwner: valuePorcent,
          coupon: sale.coupon?.code,
          saleItems: sale.items.map((item) => ({
            quantity: item.quantity,
            name: item.service.name,
            price: item.service.price,
            userEmail: sale.user.name,
          })),
        })
      }
    }

    const salesTotal = sales.reduce((acc, sale) => {
      const totals = sale.items.reduce(
        (t, item) => {
          const value = item.service.price * item.quantity
          if (item.service.isProduct) t.product += value
          else t.service += value
          t.total += value
          return t
        },
        { service: 0, product: 0, total: 0 },
      )

      let serviceShare = totals.service
      let productShare = totals.product

      if (sale.coupon) {
        if (sale.coupon.discountType === 'PERCENTAGE') {
          serviceShare -= (serviceShare * sale.coupon.discount) / 100
          productShare -= (productShare * sale.coupon.discount) / 100
        } else {
          const totalBefore = totals.service + totals.product
          const serviceDiscount =
            (totals.service / totalBefore) * sale.coupon.discount
          const productDiscount =
            (totals.product / totalBefore) * sale.coupon.discount
          serviceShare -= serviceDiscount
          productShare -= productDiscount
        }
      }

      const barberPercentage = sale.user.profile?.commissionPercentage ?? 100
      const ownerPercentage = 100 - barberPercentage
      const barberShare = serviceShare * (barberPercentage / 100)
      const ownerShare = serviceShare - barberShare + productShare
      setHistory(serviceShare, ownerPercentage, ownerShare, sale)
      return acc + ownerShare
    }, 0)

    const transactions =
      await this.transactionRepository.findManyByUser(ownerId)
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))
    return { balance, historySales }
  }
}
