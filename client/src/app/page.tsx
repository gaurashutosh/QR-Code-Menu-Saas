'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { paths } from '@/lib/paths';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  QrCode, 
  Utensils, 
  Smartphone, 
  Zap, 
  CreditCard, 
  BarChart3, 
  LayoutDashboard, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Menu,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                QR Menu
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {!loading && (
                user ? (
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link
                      href={paths.dashboard.root}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95 text-sm md:text-base"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 md:gap-4">
                    <ThemeToggle />
                    <Link
                      href={paths.admin.login}
                      className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Admin
                    </Link>
                    <Link
                      href={paths.login}
                      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href={paths.signup}
                      className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                      Get Started
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-50 dark:from-orange-950/20 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-100 dark:bg-purple-900/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-100 dark:bg-yellow-900/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 dark:bg-pink-900/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-full text-orange-700 dark:text-orange-400 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            New: WhatsApp Ordering
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight animate-fade-in-up animation-delay-100">
            Smart menus for <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
              modern restaurants
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            Create contactless QR menus, update prices instantly, and boost your operational efficiency. No hardware required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
            <Link
              href={!loading && user ? paths.dashboard.root : paths.signup}
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              {!loading && user ? "Go to Dashboard" : "Start Free Trial"}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/menu/demo"
              className="px-8 py-4 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              View Demo
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section (Mock) */}
      <section className="py-10 border-y border-gray-50 dark:border-gray-900 bg-gray-50/50 dark:bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-6">Trusted by 500+ restaurants</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-60">
             {/* Replace with actual logos if available, using placeholders for now */}
             <div className="h-8 font-bold text-xl text-gray-400 dark:text-gray-600 flex items-center gap-2"><Utensils className="w-6 h-6"/> Restaurant A</div>
             <div className="h-8 font-bold text-xl text-gray-400 dark:text-gray-600 flex items-center gap-2"><Smartphone className="w-6 h-6"/> Restaurant B</div>
             <div className="h-8 font-bold text-xl text-gray-400 dark:text-gray-600 flex items-center gap-2"><Settings className="w-6 h-6"/> Restaurant C</div>
             <div className="h-8 font-bold text-xl text-gray-400 dark:text-gray-600 flex items-center gap-2"><CreditCard className="w-6 h-6"/> Restaurant D</div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-4 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Go digital in 3 simple steps
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Get your restaurant setup in minutes without any technical knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16.666%] right-[16.666%] h-0.5 bg-gradient-to-r from-orange-100 via-orange-200 to-orange-100 dark:from-orange-900/30 dark:via-orange-800/50 dark:to-orange-900/30 z-0"></div>

            <StepCard 
              number="1"
              title="Create Account"
              description="Sign up and enter your restaurant details. Upload your logo and set your brand colors."
            />
            <StepCard 
              number="2"
              title="Add Menu"
              description="Add your categories and items. Upload photos and set prices. Mark items as veg/non-veg."
            />
            <StepCard 
              number="3"
              title="Download QR"
              description="Download your unique QR code. Print it and place it on tables. Ready to serve!"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-zinc-900/50 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Why switch to QR Menu?
                </h2>
                <div className="space-y-8">
                  <BenefitRow 
                    icon={<Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                    title="Instant Updates"
                    description="Change prices or hide out-of-stock items instantly. No more reprinting paper menus."
                  />
                  <BenefitRow 
                    icon={<Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    title="Contactless & Safe"
                    description="Provide a hygienic dining experience. Customers view the menu on their own phones."
                  />
                  <BenefitRow 
                    icon={<BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />}
                    title="Data & Insights"
                    description="Know what's selling. Track views and optimize your menu for better profitability."
                  />
                </div>
             </div>
             
             {/* Feature Grid */}
             <div className="grid grid-cols-2 gap-4">
                <FeatureBox icon={<QrCode className="w-8 h-8 text-purple-500" />} title="Custom QRs" />
                <FeatureBox icon={<Utensils className="w-8 h-8 text-orange-500" />} title="Menu Mgmt" />
                <FeatureBox icon={<CreditCard className="w-8 h-8 text-pink-500" />} title="Payments (Soon)" />
                <FeatureBox icon={<Smartphone className="w-8 h-8 text-blue-500" />} title="Mobile First" />
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Start with a 7-day free trial. Cancel anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Monthly"
              price="₹499"
              period="month"
              features={[
                'Unlimited menu items',
                'Custom branding',
                'Basic analytics',
                'Priority support',
                'WhatsApp ordering',
              ]}
              cta="Start Monthly"
            />
            <PricingCard
              title="Yearly"
              price="₹5,000"
              period="year"
              features={[
                'Everything in Monthly',
                '2 Months FREE',
                'Advanced analytics',
                'Dedicated account manager',
                'Custom QR designs',
              ]}
              popular
              cta="Start Yearly & Save"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-gray-900 dark:bg-zinc-900 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
            Ready to digitize your restaurant?
          </h2>
          <p className="text-xl text-gray-400 dark:text-gray-500 mb-8 max-w-2xl mx-auto relative z-10">
            Join hundreds of restaurants growing with QR Menu. Setup takes less than 5 minutes.
          </p>
          <Link
            href={!loading && user ? paths.dashboard.root : paths.signup}
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-orange-500/30 relative z-10"
          >
            {!loading && user ? "Go to Dashboard" : "Get Started Now"}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">QR Menu</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
              <Link href="mailto:support@qrmenu.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact Support</Link>
            </div>
            <p className="text-gray-400 dark:text-gray-600 text-sm">
              © 2026 QR Menu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl">
      <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-2xl flex items-center justify-center text-2xl font-bold text-orange-600 dark:text-orange-400 mb-6 shadow-sm">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureBox({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center gap-4 hover:shadow-lg transition-shadow">
      {icon}
      <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
    </div>
  );
}



function PricingCard({
  title,
  price,
  period,
  features,
  popular,
  cta
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  cta: string;
}) {
  return (
    <div className={`p-8 rounded-3xl border ${popular ? 'border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20 relative overflow-hidden' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900'} flex flex-col`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
          MOST POPULAR
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
        <span className="text-gray-500 dark:text-gray-400">/{period}</span>
      </div>
      
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <CheckCircle2 className={`w-5 h-5 ${popular ? 'text-orange-500' : 'text-gray-400 dark:text-gray-600'}`} />
            {feature}
          </li>
        ))}
      </ul>
      
      <Link
        href="/signup"
        className={`w-full py-4 rounded-xl font-semibold text-center transition-all ${
          popular
            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25'
            : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
