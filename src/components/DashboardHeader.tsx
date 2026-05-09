import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, Droplets, RefreshCw } from 'lucide-react';
import Spinner from './Spinner';

interface DashboardHeaderProps {
  balance: number;
  isLoadingBalance: boolean;
  isFunding: boolean;
  onFaucet: () => void;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  balance,
  isLoadingBalance,
  isFunding,
  onFaucet,
  onRefresh,
}) => {
  const { publicKey } = useWallet();

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: wallet info */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <button
                onClick={onRefresh}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh balance"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoadingBalance ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-muted-foreground text-base">Loading...</span>
                </span>
              ) : (
                <>
                  {balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-sm font-medium text-muted-foreground">tUSDC</span>
                </>
              )}
            </p>
            {publicKey && (
              <p className="mt-0.5 text-xs text-muted-foreground font-mono">{truncatedAddress}</p>
            )}
          </div>
        </div>

        {/* Right: faucet button */}
        <button
          onClick={onFaucet}
          disabled={isFunding}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFunding ? (
            <>
              <Spinner size="sm" />
              Activating...
            </>
          ) : (
            <>
              <Droplets className="h-4 w-4" />
              Activate Devnet Account
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;