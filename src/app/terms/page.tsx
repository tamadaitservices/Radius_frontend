import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using RadiuYes.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

      <div className="prose prose-sm text-gray-700 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. About RadiuYes</h2>
          <p>RadiuYes is a hyperlocal shop discovery platform operated by GenieHost Private Limited, Vijayawada, Andhra Pradesh, India. We connect customers with nearby shops. We do not sell products, hold inventory, or facilitate payments.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Reservations</h2>
          <p>A reservation on RadiuYes holds an item at a shop for up to 45 minutes after vendor acceptance. Reservations are not orders — no money is collected by RadiuYes. The agreed price is between the customer and vendor. RadiuYes is not liable for disputes arising from the transaction.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Customer Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide a valid Indian mobile number for OTP verification.</li>
            <li>Honour reservations you accept — repeated no-shows may result in account suspension.</li>
            <li>Deal directly with the vendor for payment, refunds, and product quality.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Vendor Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ensure product listings are accurate and in-stock.</li>
            <li>Respond to reservations within the window shown to the customer.</li>
            <li>Not use RadiuYes to list counterfeit, prohibited, or illegal goods.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Platform Rules</h2>
          <p>RadiuYes reserves the right to suspend or remove any account or listing that violates these terms, contains false information, or is reported for abuse.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Limitation of Liability</h2>
          <p>RadiuYes is a discovery and reservation platform only. We are not party to any transaction between customer and vendor and accept no liability for product quality, disputes, or losses arising from transactions arranged through the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Governing Law</h2>
          <p>These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Vijayawada, Andhra Pradesh.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. Contact</h2>
          <p>For any queries, email <a href="mailto:hello@radiuyes.com" className="text-green-700 underline">hello@radiuyes.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
