import React from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  TrendingUp,
  ShieldCheck,
  Zap,
  PiggyBank,
  BarChart3,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';

const borrowerFeatures = [
  {
    icon: Banknote,
    title: '0% Interest Loans',
    description: 'Borrow against your revenue-generating assets with zero interest rates. Ever.',
  },
  {
    icon: ShieldCheck,
    title: 'Revenue-Backed',
    description: 'Your future revenue is your collateral. No liquidations from price volatility.',
  },
  {
    icon: Zap,
    title: 'Instant Disbursement',
    description: 'Funds hit your wallet in seconds. Powered by Solana for a frictionless experience.',
  },
];

const investorFeatures = [
  {
    icon: TrendingUp,
    title: 'Real Yield',
    description: 'Earn from actual business revenue, not inflationary token emissions.',
  },
  {
    icon: PiggyBank,
    title: 'Symmetric Returns',
    description: 'When borrowers succeed, you succeed. Aligned incentives by design.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Vaults',
    description: 'Full on-chain visibility into vault performance and revenue distribution.',
  },
];

const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}> = ({ icon: Icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="glass-card rounded-2xl p-6 group hover:glow-border transition-all duration-300"
  >
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
  </motion.div>
);

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Borrowers */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-4">
              <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">For Borrowers</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Get funded without the <span className="text-gradient">interest trap</span>
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Traditional DeFi lending charges you compounding interest. SymmFi lets you repay through
              a fair share of your generated revenue instead.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {borrowerFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>

        {/* Investors */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 mb-4">
              <ArrowUpFromLine className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">For Investors</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Earn <span className="text-gradient">real revenue</span>, not ponzi yields
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Deposit into diversified vaults and receive a proportional share of borrower revenue.
              Your returns are tied to real economic activity.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investorFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;