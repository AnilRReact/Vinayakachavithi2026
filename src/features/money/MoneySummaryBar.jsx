import React from 'react'
import { currency } from '../../lib/formatters'

export function MoneySummaryBar({ raised = 0, spent = 0, balance = 0, reusableWorth = 0 }) {
  return (
    <div className="moneybar">
      <div className="moneybar-item collected">
        <span className="moneybar-label">Collected</span>
        <b className="moneybar-val">{currency.format(raised)}</b>
      </div>
      <div className="moneybar-item spent">
        <span className="moneybar-label">Spent</span>
        <b className="moneybar-val">{currency.format(spent)}</b>
      </div>
      <div className="moneybar-item balance">
        <span className="moneybar-label">Net Balance</span>
        <b className="moneybar-val" style={{ color: balance >= 0 ? '#15803d' : '#b91c1c' }}>
          {currency.format(balance)}
        </b>
      </div>
      {reusableWorth > 0 && (
        <div className="moneybar-item inventory">
          <span className="moneybar-label">Assets / Inventory</span>
          <b className="moneybar-val">{currency.format(reusableWorth)}</b>
        </div>
      )}
    </div>
  )
}
