type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingTop: 32,
      paddingBottom: 48,
    }}>
      {getPages().map((page, i) =>
        page === '...' ? (
          <span
            key={`e${i}`}
            style={{
              padding: '0 8px',
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--color-text-muted)',
              userSelect: 'none',
            }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              background: currentPage === page ? 'var(--color-primary)' : 'transparent',
              color: currentPage === page ? '#000' : 'rgba(255,255,255,0.30)',
              border: currentPage === page ? 'none' : '1px solid rgba(255,255,255,0.08)',
              outline: 'none',
            }}
            onMouseEnter={e => {
              if (currentPage !== page) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,104,70,0.30)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)'
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== page) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.30)'
              }
            }}
          >
            {page}
          </button>
        )
      )}
    </div>
  )
}
