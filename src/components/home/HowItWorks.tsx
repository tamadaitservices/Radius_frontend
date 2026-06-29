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
    <section className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-green-700">How it works</span>
        <h2 className="text-2xl font-black text-gray-900 mt-1">Six steps. Three minutes. Product in hand.</h2>
        <p className="text-gray-500 mt-1 text-sm">No delivery. No waiting. No commission.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STEPS.map((step) => (
          <div key={step.n} className="text-center p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors">
            <div
              className="w-8 h-8 rounded-lg text-white text-xs font-black flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              {step.n}
            </div>
            <div className="text-2xl mb-2">{step.icon}</div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Value props */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        {[
          { label: '6 Months Free', sub: 'for all vendors', color: 'text-green-700' },
          { label: '0% Commission', sub: 'ever, for anyone', color: 'text-orange-600' },
          { label: '3 Taps', sub: 'find, call, navigate', color: 'text-blue-600' },
        ].map((v) => (
          <div key={v.label} className="text-center">
            <p className={`text-xl font-black ${v.color}`}>{v.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{v.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
