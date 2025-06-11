    // TODO: implementar logica que calcula o balanço do barbeiro contanto
    // com os cupons de desconto e se o valor foi setado diferente do valor
    // real da compra
    const sales = await this.saleRepository.findManyByUser(barberId)
    const salesTotal = sales.reduce((acc, sale) => {
      const servicesTotal = sale.items.reduce((sum, item) => {
        if (!item.service.isProduct) {
          return sum + item.service.price * item.quantity
        return sum
      }, 0)
      return acc + servicesTotal
    }, 0)

    const transactions =
      await this.transactionRepository.findManyByUser(barberId)
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = salesTotal + additions - withdrawals
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
