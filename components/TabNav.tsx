import Link from 'next/link'

export default function TabNav({ active }: { active: 'entry' | 'records' }) {
  return (
    <div className="flex justify-center gap-6 border-b border-green-200 mb-6 pb-2">
      <Link
        href="/"
        className={`text-sm font-semibold pb-1 ${active === 'entry' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        📝 New Entry
      </Link>
      <Link
        href="/records"
        className={`text-sm font-semibold pb-1 ${active === 'records' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        📋 Records
      </Link>
    </div>
  )
}
