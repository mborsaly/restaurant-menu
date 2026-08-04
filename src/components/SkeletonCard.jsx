// src/components/SkeletonCard.jsx — final version (replaces the above)
export function SkeletonCard() {
  return (
    <div style={{
      background: 'white', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(45,42,38,0.06)',
    }}>
      <div style={{
        width: '100%', aspectRatio: '4/3',
        background: 'linear-gradient(90deg, #F0EEE6 0%, #FAF9F5 50%, #F0EEE6 100%)',
        backgroundSize: '200% 100%', animation: 'bv-shimmer 1.4s ease-in-out infinite',
      }} />
      <div style={{ padding: '14px 14px 16px' }}>
        <div style={{ height: 14, width: '70%', borderRadius: 6, background: '#F0EEE6', marginBottom: 8 }} />
        <div style={{ height: 10, width: '90%', borderRadius: 6, background: '#F5F3EE', marginBottom: 6 }} />
        <div style={{ height: 10, width: '50%', borderRadius: 6, background: '#F5F3EE', marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: 16, width: 50, borderRadius: 6, background: '#F0EEE6' }} />
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F0EEE6' }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      <style>{`
        @keyframes bv-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}