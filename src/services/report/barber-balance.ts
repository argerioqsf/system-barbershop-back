    const transactions = await this.transactionRepository.findMany()

    const saleTransactions = transactions.filter(
      (t) => t.sale && t.sale.items.some((i) => i.barberId === barberId),
    )

    let salesTotal = 0
    for (const t of saleTransactions) {
      const sale = t.sale!
      const totals = sale.items.reduce(
        (acc, item) => {
          const value = (item.total ?? item.service.price * item.quantity)
          if (!item.service.isProduct) {
            acc.service += value
            if (item.barberId === barberId) acc.barber += value
          } else {
            acc.product += value
          }
          acc.total += value
          return acc
        { service: 0, product: 0, total: 0, barber: 0 },
      let serviceAfter = totals.service
      let productAfter = totals.product
      let barberAfter = totals.barber
      if (sale.coupon) {
        const discount =
          sale.coupon.discountType === 'PERCENTAGE'
            ? (totals.total * sale.coupon.discount) / 100
            : sale.coupon.discount
        const serviceDisc = discount * (totals.service / totals.total)
        const productDisc = discount * (totals.product / totals.total)
        serviceAfter -= serviceDisc
        productAfter -= productDisc
        if (totals.service > 0) {
          barberAfter -= serviceDisc * (totals.barber / totals.service)
      const sumAfter = serviceAfter + productAfter
      if (sumAfter > 0 && sumAfter !== sale.total) {
        const scale = sale.total / sumAfter
        serviceAfter *= scale
        barberAfter *= scale
      const commissionPerc = sale.items.find(
        (i) => i.barberId === barberId,
      )?.barber?.profile?.commissionPercentage ?? 100
      salesTotal += barberAfter * (commissionPerc / 100)
    }

    const manualTotals = (await this.transactionRepository.findManyByUser(barberId))
      .filter((t) => !t.sale)
      .reduce(
        (totals, t) => {
          if (t.type === 'ADDITION') totals.additions += t.amount
          else if (t.type === 'WITHDRAWAL') totals.withdrawals += t.amount
          return totals
        },
        { additions: 0, withdrawals: 0 },
    const balance = Number(
      (salesTotal + manualTotals.additions - manualTotals.withdrawals).toFixed(2),
      if (valueService > 0) {
        historySales.push({
          valueService,
          percentage,
          valueBarber: valuePorcent,
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
      const { service: rawService, product: rawProduct } = sale.items.reduce(
        (totals, item) => {
          const value = item.service.price * item.quantity
          item.service.isProduct
            ? (totals.product += value)
            : (totals.service += value)
          return totals
        },
        { service: 0, product: 0 },
      )

      let serviceShare = rawService
      let productShare = rawProduct

      if (sale.coupon && serviceShare > 0) {
        const { discountType, discount } = sale.coupon
        if (discountType === 'PERCENTAGE') {
          serviceShare -= (serviceShare * discount) / 100
          productShare -= (productShare * discount) / 100
        } else {
          serviceShare -= discount
          productShare -= discount
        }
      }

      const total = serviceShare + productShare
      const percentage = sale.user.profile?.commissionPercentage ?? 100
      if (total === sale.total) {
        const valueService = Number(serviceShare.toFixed(2))
        const valuePorcent = (valueService * percentage) / 100
        setHistory(valueService, percentage, valuePorcent, sale)
        return acc + valuePorcent
      }
      if (productShare <= 0) {
        const valueService = Number(sale.total.toFixed(2))
        const valuePorcent = (valueService * percentage) / 100
        setHistory(valueService, percentage, valuePorcent, sale)
        return acc + valuePorcent
      }

      const porcentService = sale.coupon
        ? (100 * rawService) / (rawService + rawProduct)
        : (100 * serviceShare) / total

      const valueService = Number(
        ((sale.total * porcentService) / 100).toFixed(2),
      )
      const valuePorcent = (valueService * percentage) / 100
      setHistory(valueService, percentage, valuePorcent, sale)
      return acc + valuePorcent
    }, 0)

    const { additions, withdrawals } = (
      await this.transactionRepository.findManyByUser(barberId)
    ).reduce(
      (totals, t) => {
        if (t.type === 'ADDITION') totals.additions += t.amount
        else if (t.type === 'WITHDRAWAL') totals.withdrawals += t.amount
        return totals
      },
      { additions: 0, withdrawals: 0 },
    )

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))

    return { balance, historySales }
  }
}
