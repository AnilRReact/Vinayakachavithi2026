import React, { useState, useMemo } from 'react'
import { MoneySummaryBar } from './MoneySummaryBar'
import { DonationsSection } from './DonationsSection'
import { ExpensesSection } from './ExpensesSection'
import { PrasadSponsorsSection } from './PrasadSponsorsSection'
import { InventorySection } from './InventorySection'
import { Bidding } from './Bidding'
import { ExcelImportModal } from '../../components/ExcelImportModal'

export function Money({ data, admin, add, update, remove, recordBid, closeBid }) {
  const [activeSubTab, setActiveSubTab] = useState('donations')
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [importSegment, setImportSegment] = useState('donations')

  const openExcelImport = (seg = 'donations') => {
    setImportSegment(seg)
    setExcelModalOpen(true)
  }

  const settings = data.settings?.[0] || {}
  const donations = data.donations || []
  const expenses = data.expenses || []
  const purchases = data.purchases || []
  const prasadSponsors = data.prasad_sponsors || []

  // Calculated totals
  const raised = useMemo(
    () => donations.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [donations]
  )
  const spent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  )
  const balance = useMemo(() => raised - spent, [raised, spent])

  const reusablePurchases = useMemo(
    () => purchases.filter((p) => p.reusable),
    [purchases]
  )
  const reusableWorth = useMemo(
    () => reusablePurchases.reduce((sum, p) => sum + Number(p.cost || 0), 0),
    [reusablePurchases]
  )

  return (
    <div className="money-feature-container">
      {/* 1. Global Financial Summary Bar */}
      <MoneySummaryBar
        raised={raised}
        spent={spent}
        balance={balance}
        reusableWorth={reusableWorth}
      />

      {/* 2. Sub-navigation Pills */}
      <div className="sub-nav-bar">
        <button
          type="button"
          className={`sub-nav-pill ${activeSubTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('donations')}
        >
          💰 Donations <span className="pill-count">{donations.length}</span>
        </button>
        <button
          type="button"
          className={`sub-nav-pill ${activeSubTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('expenses')}
        >
          💸 Expenses <span className="pill-count">{expenses.length}</span>
        </button>
        <button
          type="button"
          className={`sub-nav-pill ${activeSubTab === 'sponsors' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sponsors')}
        >
          🍯 Prasadam Sponsors <span className="pill-count">{prasadSponsors.length}</span>
        </button>
        <button
          type="button"
          className={`sub-nav-pill ${activeSubTab === 'bidding' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('bidding')}
        >
          🏆 Laddu Auction
        </button>
        <button
          type="button"
          className={`sub-nav-pill ${activeSubTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('inventory')}
        >
          🏷️ Assets & Inventory <span className="pill-count">{purchases.length}</span>
        </button>
      </div>

      {/* 3. Render Active Sub-feature */}
      {activeSubTab === 'donations' && (
        <DonationsSection
          donations={donations}
          settings={settings}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
          onOpenExcelImport={openExcelImport}
        />
      )}

      {activeSubTab === 'expenses' && (
        <ExpensesSection
          expenses={expenses}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
          onOpenExcelImport={openExcelImport}
        />
      )}

      {activeSubTab === 'sponsors' && (
        <PrasadSponsorsSection
          prasadSponsors={prasadSponsors}
          settings={settings}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
          onOpenExcelImport={openExcelImport}
        />
      )}

      {activeSubTab === 'bidding' && (
        <Bidding
          data={data}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
          recordBid={recordBid}
          closeBid={closeBid}
        />
      )}

      {activeSubTab === 'inventory' && (
        <InventorySection
          purchases={purchases}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
        />
      )}

      {/* Universal Bulk Excel / CSV Import Modal */}
      {excelModalOpen && (
        <ExcelImportModal
          isOpen={excelModalOpen}
          initialSegment={importSegment}
          onClose={() => setExcelModalOpen(false)}
          onImportSuccess={async (importedRows, segment) => {
            const tableMap = {
              donations: 'donations',
              expenses: 'expenses',
              prasad_sponsors: 'prasad_sponsors',
              purchases: 'purchases'
            }
            const targetTable = tableMap[segment] || segment
            for (const row of importedRows) {
              await add(targetTable, row)
            }
          }}
        />
      )}
    </div>
  )
}
