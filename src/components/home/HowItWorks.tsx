const STEPS = [
  { n: '01', title: 'Search', desc: 'Type product name or use natural language like "blue kurta under 500"', icon: '🔍' },
  { n: '02', title: 'Discover', desc: 'See nearby shops with stock, price, distance and ratings', icon: '📍' },
  { n: '03', title: 'Call', desc: 'One tap calls the vendor directly. Discuss pricing and availability on call', icon: '📞' },
  { n: '04', title: 'Reserve', desc: 'Tap Reserve — shop holds the item for 45 minutes just for you', icon: '🔒' },
  { n: '05', title: 'Navigate', desc: 'Google Maps opens inside RadiuYes with directions to the shop', icon: '🗺️' },
  { n: '06', title: 'Buy', desc: 'Walk in, pick up, pay at counter. Done in minutes', icon: '🛍️' },
];

export default function HowItWorks() {
  return (
    <section className="ry-card p-6 sm:p-8">
      <div className="text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-ink)]">How it works</span>
        <h2 className="text-2xl font-black mt-1" style={{ color: 'var(--foreground)' }}>Six steps. Three minutes. Product in hand.</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>No delivery. No waiting. No commission.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STEPS.map((step) => (
          <div key={step.n} className="text-center p-4 rounded-[22px] transition-colors hover:bg-[var(--brand-light)]" style={{ background: 'var(--surface-2)' }}>
            <div
              className="w-8 h-8 rounded-full text-xs font-black flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--on-brand)' }}
            >
              {step.n}
            </div>
            <div className="text-2xl mb-2">{step.icon}</div>
            <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--foreground)' }}>{step.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Value props */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
        {[
          { label: '6 Months Free', sub: 'for all vendors', color: 'text-[var(--brand-ink)]' },
          { label: '0% Commission', sub: 'ever, for anyone', color: 'text-[var(--brand-ink)]' },
          { label: '3 Taps', sub: 'find, call, navigate', color: 'text-[var(--brand-ink)]' },
        ].map((v) => (
          <div key={v.label} className="text-center">
            <p className={`text-xl font-black ${v.color}`}>{v.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{v.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
