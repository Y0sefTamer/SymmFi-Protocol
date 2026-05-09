import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpFromLine, ArrowDownToLine, CheckCircle2, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

interface InvestorCardProps {
  onDeposit: (amount: number) => Promise<string>;
  onWithdraw: (amount: number) => Promise<string>;
  onSuccess: () => void;
}

const InvestorCard: React.FC<InvestorCardProps> = ({ onDeposit, onWithdraw, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'deposit-success' | 'withdraw-success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsDepositing(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const sig = await onDeposit(numAmount);
      setTxSignature(sig);
      setStatus('deposit-success');
      setAmount('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Deposit failed');
      setStatus('error');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsWithdrawing(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const sig = await onWithdraw(numAmount);
      setTxSignature(sig);
      setStatus('withdraw-success');
      setAmount('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Withdrawal failed');
      setStatus('error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isProcessing = isDepositing || isWithdrawing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-border/50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Co-Invest in Vault</h3>
            <p className="text-xs text-muted-foreground">Earn symmetric revenue share from borrowers</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Vault stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Estimated APY</p>
            <p className="mt-1 text-xl font-bold text-gradient">8.4%</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Vault TVL</p>
            <p className="mt-1 text-xl font-bold text-foreground">$1.2M</p>
          </div>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 pr-16 text-foreground placeholder-muted-foreground/50 text-lg font-medium transition-colors focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
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

        {/* Vault terms summary */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Revenue Share</span>
            <span className="font-medium text-foreground">Proportional</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lock Period</span>
            <span className="font-medium text-foreground">None (Flexible)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium text-primary">Powered by Solana</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDeposit}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
          >
            {isDepositing ? (
              <Spinner size="sm" className="border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4" />
                Deposit
              </>
            )}
          </button>
          <button
            onClick={handleWithdraw}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isWithdrawing ? (
              <Spinner size="sm" />
            ) : (
              <>
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw
              </>
            )}
          </button>
        </div>

        {/* Status messages */}
        {status === 'deposit-success' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
          >
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">Deposit Successful!</p>
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
        {status === 'withdraw-success' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
          >
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">Withdrawal Successful (+5% yield)!</p>
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

export default InvestorCard;