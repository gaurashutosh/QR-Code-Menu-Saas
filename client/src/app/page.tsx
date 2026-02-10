import Link from 'next/link';
import { QrCode, Utensils, Smartphone, Zap, CreditCard, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">QR Menu</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/login"
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Admin
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            7-Day Free Trial • No Credit Card Required
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Digital Menus for{' '}
            <span className="gradient-text">Modern Restaurants</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Create beautiful, contactless QR code menus in minutes. Update prices instantly, 
            track analytics, and delight your customers with a seamless mobile experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/menu/demo"
              className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all border-2 border-gray-200"
            >
              View Demo Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Go Digital
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you create, manage, and grow your digital menu presence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<QrCode className="w-8 h-8" />}
              title="QR Code Generation"
              description="Generate unique QR codes for your restaurant. Print and place on tables for instant menu access."
            />
            <FeatureCard
              icon={<Utensils className="w-8 h-8" />}
              title="Easy Menu Management"
              description="Add, edit, and organize menu items with categories. Mark items as veg/non-veg, set availability."
            />
            <FeatureCard
              icon={<Smartphone className="w-8 h-8" />}
              title="Mobile-First Design"
              description="Beautiful, fast-loading menus optimized for all devices. No app download required for customers."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Instant Updates"
              description="Change prices, add items, or mark dishes unavailable in real-time. No reprinting needed."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Analytics Dashboard"
              description="Track menu views, popular items, and customer engagement with detailed insights."
            />
            <FeatureCard
              icon={<CreditCard className="w-8 h-8" />}
              title="Simple Pricing"
              description="Affordable monthly plans starting at ₹199. No hidden fees, cancel anytime."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <PricingCard
              title="Basic"
              monthlyPrice="₹199"
              yearlyPrice="₹1,999"
              features={[
                'Up to 50 menu items',
                'QR code generation',
                'Basic analytics',
                'Email support',
              ]}
            />
            <PricingCard
              title="Pro"
              monthlyPrice="₹299"
              yearlyPrice="₹2,999"
              popular
              features={[
                'Unlimited menu items',
                'Custom branding',
                'Advanced analytics',
                'Priority support',
                'Multiple categories',
                'Item images',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Menu?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join hundreds of restaurants already using QR Menu. Start your free trial today.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold text-lg hover:bg-orange-50 transition-all shadow-lg"
          >
            Start Your Free Trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">QR Menu</span>
            </div>
            <div className="flex gap-8 text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 QR Menu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-50 rounded-2xl hover:bg-orange-50 transition-colors group">
      <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({
  title,
  monthlyPrice,
  yearlyPrice,
  features,
  popular,
}: {
  title: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div className={`p-8 rounded-2xl ${popular ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-white'} relative`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
          Most Popular
        </div>
      )}
      <h3 className={`text-2xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>{monthlyPrice}</span>
        <span className={popular ? 'text-orange-100' : 'text-gray-500'}>/month</span>
        <p className={`text-sm mt-1 ${popular ? 'text-orange-100' : 'text-gray-500'}`}>
          or {yearlyPrice}/year (save 2 months)
        </p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${popular ? 'text-orange-200' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={popular ? 'text-white' : 'text-gray-600'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
          popular
            ? 'bg-white text-orange-600 hover:bg-orange-50'
            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
