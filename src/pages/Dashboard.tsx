import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useSymmFiProgram } from '@/hooks/useSymmFiProgram';
import Navbar from '@/components/Navbar';
import DashboardHeader from '@/components/DashboardHeader';
import BorrowerCard from '@/components/BorrowerCard';
import InvestorCard from '@/components/InvestorCard';
import ProtocolStats from '@/components/ProtocolStats';
import { BarChart3, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    fundUserAccount,
    depositToVault,
    withdrawFromVault,
    borrowFunds,
    getUserBalance,
    sponsorConfigured,
  } = useSymmFiProgram();

  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isFunding, setIsFunding] = useState(false);

  const refreshBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const bal = await getUserBalance();
      setBalance(bal);
    } catch {
      setBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [getUserBalance]);

  useEffect(() => {
    if (!connected) {
      navigate('/');
      return;
    }
    refreshBalance();
  }, [connected, navigate, refreshBalance]);

  const handleFaucet = async () => {
    setIsFunding(true);
    try {
      const sig = await fundUserAccount();
      toast({
        title: 'Account Activated!',
        description: '1,000 tUSDC has been deposited to your devnet wallet.',
      });
      await refreshBalance();
    } catch (err: any) {
      toast({
        title: 'Faucet Failed',
        description: err?.message || 'Could not fund your account.',
        variant: 'destructive',
      });
    } finally {
      setIsFunding(false);
    }
  };

  const handleBorrow = async (amount: number) => {
    const sig = await borrowFunds(amount);
    toast({
      title: 'Loan Disbursed!',
      description: `${amount} tUSDC has been sent to your wallet at 0% interest.`,
    });
    return sig;
  };

  const handleDeposit = async (amount: number) => {
    const sig = await depositToVault(amount);
    toast({
      title: 'Deposit Successful!',
      description: `${amount} tUSDC deposited into the SymmFi Vault.`,
    });
    return sig;
  };

  const handleWithdraw = async (amount: number) => {
    const sig = await withdrawFromVault(amount);
    toast({
      title: 'Withdrawal Successful!',
      description: `${(amount * 1.05).toFixed(2)} tUSDC withdrawn (includes 5% yield).`,
    });
    return sig;
  };

  if (!connected) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Symmetrical Finance -- Borrow or Invest with frictionless UX & ultra-low fees
              </p>
            </div>
          </motion.div>

          

          {/* Protocol stats */}
          <ProtocolStats />

          {/* Balance header */}
          <DashboardHeader
            balance={balance}
            isLoadingBalance={isLoadingBalance}
            isFunding={isFunding}
            onFaucet={handleFaucet}
            onRefresh={refreshBalance}
          />

          {/* Two-sided marketplace */}
          <div className="grid gap-6 lg:grid-cols-2">
            <BorrowerCard onBorrow={handleBorrow} onSuccess={refreshBalance} />
            <InvestorCard
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onSuccess={refreshBalance}
            />
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground/60 pt-4">
            This is a hackathon demo on Solana Devnet. All tokens are test tokens with no real value.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;