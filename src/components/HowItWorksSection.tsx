import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRightLeft, HandCoins, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    step: '01',
    title: 'Connect Wallet',
    description: 'Connect your Solana wallet and activate your account with free test USDC.',
  },
  {
    icon: ArrowRightLeft,
    step: '02',
    title: 'Choose Your Side',
    description: 'Borrow funds at 0% interest or co-invest in revenue-backed vaults.',
  },
  {
    icon: HandCoins,
    step: '03',
    title: 'Frictionless UX',
    description: 'Ultra-low fees on Solana. Transactions confirm in under a second.',
  },
  {
    icon: TrendingUp,
    step: '04',
    title: 'Earn or Repay',
    description: 'Investors earn revenue share. Borrowers repay from future earnings.',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 border-t border-border/50">
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'var(--gradient-glow)' }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How <span className="text-gradient">SymmFi</span> Works
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Four simple steps to a fairer financial system.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative glass-card rounded-2xl p-6 text-center group hover:glow-border transition-all duration-300"
            >
              <div className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {item.step}
              </div>
              <div className="mt-2 mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;