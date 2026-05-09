import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Zap, Lock } from 'lucide-react';

const stats = [
  { icon: Shield, label: 'Active Loans', value: '47', color: 'text-primary' },
  { icon: Users, label: 'Co-Investors', value: '312', color: 'text-accent' },
  { icon: Zap, label: 'Transactions', value: '2,841', color: 'text-primary' },
  { icon: Lock, label: 'Total Secured', value: '$2.4M', color: 'text-accent' },
];

const ProtocolStats: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-card rounded-xl p-4 text-center"
        >
          <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-2`} />
          <p className="text-lg font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </motion.div>
  );
};

export default ProtocolStats;
