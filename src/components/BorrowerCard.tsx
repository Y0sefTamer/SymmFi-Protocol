import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, ArrowDownToLine, CheckCircle2, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

interface BorrowerCardProps {
  onBorrow: (amount: number) => Promise<string>;
  onSuccess: () => void;
}

const BorrowerCard: React.FC<BorrowerCardProps> = ({ onBorrow, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBorrow = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsProcessing(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const sig = await onBorrow(numAmount);
      setTxSignature(sig);
      setStatus('success');
      setAmount('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Transaction failed');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-border/50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Get Interest-Free Loan</h3>
            <p className="text-xs text-muted-foreground">Borrow against future revenue at 0% APR</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Info banner */}
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <ArrowDownToLine className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Revenue-Backed Loan</p>
              <p className="text-xs text-muted-foreground mt-1">
                Repay through automatic revenue share -- no liquidation risk from price volatility.
              </p>
            </div>
          </div>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Loan Amount
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 pr-16 text-foreground placeholder-muted-foreground/50 text-lg font-medium transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              tUSDC
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            {[100, 250, 500].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(String(preset))}
                disabled={isProcessing}
                className="rounded-lg border border-border bg-secondary/30 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Loan terms summary */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interest Rate</span>
            <span className="font-semibold text-primary">0.00%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Revenue Share</span>
            <span className="font-medium text-foreground">5% of earnings</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium text-primary">Powered by Solana</span>
          </div>
        </div>

        {/* Borrow button */}
        <button
          onClick={handleBorrow}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" className="border-primary-foreground/30 border-t-primary-foreground" />
              Processing Loan...
            </span>
          ) : (
            'Borrow Now'
          )}
        </button>

        {/* Status messages */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
          >
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">Loan Disbursed!</p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary/70 underline hover:text-primary break-all"
              >
                View on Explorer
              </a>
            </div>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
          >
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{errorMsg}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BorrowerCard;