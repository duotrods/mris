'use client'

import { useState, useTransition, useRef } from 'react'
import { submitEntry, SubmitResult } from '@/actions/submitEntry'
import { getPreviousEndingBalance } from '@/actions/getPreviousEndingBalance'
import DuplicateAlert from './DuplicateAlert'
import TabNav from './TabNav'

const SITES = ['TR-11', 'TR-12', 'TR-14', 'TR-16', 'B-4', 'B-5']
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function EntryForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SubmitResult | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const entryDateRef = useRef<HTMLInputElement>(null)

  const [beginningBalance, setBeginningBalance] = useState('')
  const [beginningLocked, setBeginningLocked] = useState(false)
  const [receivingLiters, setReceivingLiters] = useState('')
  const [issuanceLiters, setIssuanceLiters] = useState('')

  const endingBalance = (() => {
    const b = parseFloat(beginningBalance)
    const r = parseFloat(receivingLiters)
    const i = parseFloat(issuanceLiters)
    if (isNaN(b) && isNaN(r) && isNaN(i)) return null
    return (isNaN(b) ? 0 : b) + (isNaN(r) ? 0 : r) - (isNaN(i) ? 0 : i)
  })()

  async function handleSiteChange(site: string) {
    if (!site) {
      setBeginningBalance('')
      setBeginningLocked(false)
      return
    }
    const prev = await getPreviousEndingBalance(site)
    if (prev !== null) {
      setBeginningBalance(prev.toFixed(2))
      setBeginningLocked(true)
    } else {
      setBeginningBalance('')
      setBeginningLocked(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('ending_balance', endingBalance !== null ? endingBalance.toFixed(2) : '0')
    startTransition(async () => {
      const res = await submitEntry(formData)
      setResult(res)
      if (res.status === 'success') {
        formRef.current?.reset()
        if (entryDateRef.current) entryDateRef.current.value = todayStr()
        setBeginningBalance('')
        setBeginningLocked(false)
        setReceivingLiters('')
        setIssuanceLiters('')
      }
    })
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-green-900 text-center mb-2">MRIS Validation System</h1>
        <TabNav active="entry" />

        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xs font-bold text-green-900 uppercase tracking-wide mb-4">New MRIS Entry</h2>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">For Site</label>
              <select name="for_site" required
                onChange={e => handleSiteChange(e.target.value)}
                className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm text-gray-900">
                <option value="">-- Select Site --</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Beginning Balance <span className="text-green-600 normal-case">(No. of Liters)</span>
              </label>
              <input
                name="beginning_balance"
                type="number"
                step="0.01"
                required
                readOnly={beginningLocked}
                value={beginningBalance}
                onChange={e => setBeginningBalance(e.target.value)}
                placeholder="Enter beginning balance"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  beginningLocked
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-50 border-green-100'
                }`}
              />
              {beginningLocked && (
                <p className="text-xs text-gray-400 mt-1">Auto-filled from previous ending balance</p>
              )}
            </div>

            <div className="border border-green-100 rounded-lg p-3 space-y-3">
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide">Receiving</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Date</label>
                <input name="receiving_date" type="date" required
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">MD Number</label>
                <input name="md_number" type="text" required placeholder="e.g. MD-001"
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">No. of Liters</label>
                <input name="receiving_liters" type="number" step="0.01" min="0" required placeholder="0.00"
                  value={receivingLiters}
                  onChange={e => setReceivingLiters(e.target.value)}
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
            </div>

            <div className="border border-green-100 rounded-lg p-3 space-y-3">
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide">Issuance</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">MRIS #</label>
                <input name="mris_number" type="text" required placeholder="e.g. 2026-001"
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"># of Liters</label>
                <input name="liters" type="number" step="0.01" min="0" required placeholder="0.00"
                  value={issuanceLiters}
                  onChange={e => setIssuanceLiters(e.target.value)}
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Date Issued</label>
                  <input name="date_issued" type="date" required
                    className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Date <span className="text-green-600 normal-case">(today)</span>
                  </label>
                  <input ref={entryDateRef} name="entry_date" type="date" required defaultValue={todayStr()}
                    className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Ending Balance <span className="text-green-600 normal-case">(No. of Liters)</span>
              </label>
              <input
                type="text"
                readOnly
                value={endingBalance !== null ? endingBalance.toFixed(2) : '—'}
                className="w-full px-3 py-2 border border-green-200 rounded-md bg-gray-50 text-sm font-semibold text-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Beginning + Receiving − Issuance</p>
            </div>

            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-lg text-sm">
              {isPending ? 'Submitting...' : 'Submit Entry'}
            </button>
          </form>

          {result?.status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
              ✓ Entry saved successfully.
            </div>
          )}
          {result?.status === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              Error: {result.message}
            </div>
          )}
        </div>

        {result?.status === 'duplicate' && (
          <DuplicateAlert existing={result.existing} attempted={result.attempted} />
        )}
      </div>
    </div>
  )
}
