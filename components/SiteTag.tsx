const COLORS: Record<string, string> = {
  'TR-11': 'bg-green-100 text-green-800',
  'TR-12': 'bg-green-100 text-green-800',
  'TR-14': 'bg-green-100 text-green-800',
  'TR-16': 'bg-green-100 text-green-800',
  'B-4':   'bg-teal-100 text-teal-800',
  'B-5':   'bg-teal-100 text-teal-800',
}

export default function SiteTag({ site }: { site: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${COLORS[site] ?? 'bg-gray-100 text-gray-700'}`}>
      {site}
    </span>
  )
}
