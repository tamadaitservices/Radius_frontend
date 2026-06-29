import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How RadiuYes collects and uses your data.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

      <div className="prose prose-sm text-gray-700 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. What We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Mobile number</strong> — used only for OTP login and display. Never shared with third parties for marketing.</li>
            <li><strong>Name</strong> — optional, used for display on reservations and reviews.</li>
            <li><strong>Location</strong> — requested in the browser to show nearby shops. Stored only on your device (localStorage). We never store your GPS coordinates on our servers.</li>
            <li><strong>Reservation history</strong> — stored to power your profile and review eligibility.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Authenticate you via OTP SMS (delivered by MSG91).</li>
            <li>Show reservation history and enable verified reviews.</li>
            <li>Notify vendors of new reservations in real time (via Pusher).</li>
            <li>Improve search relevance — search queries are processed by Claude AI (Anthropic) and are not stored beyond a 1-hour cache.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. What We Don't Do</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We do not sell your data.</li>
            <li>We do not track you across other websites.</li>
            <li>We do not store payment information — all transactions are cash/UPI directly with vendors.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Third-Party Services</h2>
          <p>We use the following services, each subject to their own privacy policies:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>MSG91</strong> — OTP SMS delivery</li>
            <li><strong>Cloudinary</strong> — image hosting for shop and product photos</li>
            <li><strong>Pusher</strong> — real-time reservation notifications</li>
            <li><strong>Anthropic Claude</strong> — natural language search parsing</li>
            <li><strong>Google Maps</strong> — embedded map on shop pages (Google's privacy policy applies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Data Retention</h2>
          <p>Account data is retained while your account is active. You may request deletion by emailing us. Reservation and review data may be retained in anonymised form for platform analytics.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Your Rights</h2>
          <p>Under applicable Indian law (IT Act 2000 and DPDP Act 2023), you have the right to access, correct, and request deletion of your personal data. Contact us at <a href="mailto:privacy@radiuyes.com" className="text-green-700 underline">privacy@radiuyes.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Contact</h2>
          <p>GenieHost Private Limited, Vijayawada, Andhra Pradesh 520001, India.<br />
          Email: <a href="mailto:privacy@radiuyes.com" className="text-green-700 underline">privacy@radiuyes.com</a></p>
        </section>
      </div>
    </div>
  );
}
