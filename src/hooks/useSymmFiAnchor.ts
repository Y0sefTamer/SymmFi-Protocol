import { useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferInstruction,
} from '@solana/spl-token';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import IDL_JSON from '@/idl/symmfiIDL.json';

// ---------------------------------------------------------------------------
// Environment Configuration
// ---------------------------------------------------------------------------

const PROGRAM_ID = new PublicKey(
  (import.meta as any).env.VITE_PROGRAM_ID ?? '3gP9QwfQCm4nTiwQfKanjbzTUyTMNhPr4crKeqP8Mrch'
);

const CUSTOM_TOKEN_MINT = new PublicKey(
  (import.meta as any).env.VITE_CUSTOM_TOKEN_MINT ?? 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
);

const TOKEN_DECIMALS = 6;

// ---------------------------------------------------------------------------
// Sponsor Keypair (gasless fee payer)
// ---------------------------------------------------------------------------

function getSponsorKeypair(): Keypair | null {
  try {
    const raw = (import.meta as any).env.VITE_SPONSOR_SECRET_KEY;
    if (!raw) return null;
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
  } catch {
    console.warn('[SymmFi] Invalid or missing VITE_SPONSOR_SECRET_KEY');
    return null;
  }
}

// ---------------------------------------------------------------------------
// PDA Helpers
// ---------------------------------------------------------------------------

function deriveVaultStatePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID);
}

function deriveUserAccountPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user'), user.toBuffer()],
    PROGRAM_ID
  );
}

// ---------------------------------------------------------------------------
// Types mirroring on-chain state
// ---------------------------------------------------------------------------

export interface VaultStateAccount {
  totalDeposits: BN;
  profitSplitPercentage: number;
  oracleAdmin: PublicKey;
  isPaused: boolean;
}

export interface UserAccountData {
  depositedAmount: BN;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSymmFiAnchor() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;

  // ---- Anchor program instance (read-only provider for instruction building) ----
  const program = useMemo(() => {
    const provider = new AnchorProvider(connection, wallet as any, {
      preflightCommitment: 'confirmed',
    });
    // In Anchor >= 0.30.0, the signature is (idl, provider)
    // We inject our custom program ID directly into the IDL object
    const idlWithAddress = { ...IDL_JSON, address: PROGRAM_ID.toBase58() };
    const symmFiProgram = new Program(idlWithAddress as Idl, provider);
    return symmFiProgram;
  }, [connection, wallet]);

  // ---- Vault PDA (stable across renders) ----
  const [vaultStatePDA] = useMemo(() => deriveVaultStatePDA(), []);

  // ==========================================================================
  // INTERNAL: gasless send — sponsor pays, user signs via wallet adapter
  // ==========================================================================

  const sendSponsored = useCallback(
    async (
      instructions: TransactionInstruction[],
      extraSigners: Keypair[] = []
    ): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (!signTransaction) throw new Error("Wallet doesn't support signing");

      const sponsor = getSponsorKeypair();
      if (!sponsor)
        throw new Error(
          'Sponsor keypair not configured. Set VITE_SPONSOR_SECRET_KEY env var.'
        );

      const transaction = new Transaction();
      transaction.feePayer = sponsor.publicKey;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      instructions.forEach((ix) => transaction.add(ix));

      // Extra signers (e.g. new keypairs for token accounts)
      extraSigners.forEach((s) => transaction.partialSign(s));

      // 1. Sponsor pays for gas
      transaction.partialSign(sponsor);

      // 2. User signs
      const signedTx = await signTransaction(transaction);

      // 3. Send raw transaction
      const rawTx = signedTx.serialize();
      const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: true });

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      return signature;
    },
    [connection, publicKey, signTransaction]
  );

  // ==========================================================================
  // INTERNAL: ensure ATA exists, returning its address + optional create ix
  // ==========================================================================

  const ensureATA = useCallback(
    async (
      owner: PublicKey,
      mint: PublicKey,
      payer?: PublicKey
    ): Promise<{ ata: PublicKey; ix: TransactionInstruction | null }> => {
      const ata = await getAssociatedTokenAddress(mint, owner, true);
      try {
        await getAccount(connection, ata);
        return { ata, ix: null };
      } catch {
        return {
          ata,
          ix: createAssociatedTokenAccountInstruction(
            payer ?? (getSponsorKeypair()?.publicKey || owner),
            ata,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          ),
        };
      }
    },
    [connection]
  );

  // ==========================================================================
  // 1. FAUCET — Sponsor sends 1 000 test tokens to user's ATA (gasless)
  // ==========================================================================

  const fundUserAccount = useCallback(
    async (tokensAmount = 1000): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');

      const sponsor = getSponsorKeypair();
      if (!sponsor) throw new Error('Sponsor not configured');

      const ixs: TransactionInstruction[] = [];

      const { ata: userAta, ix: createAtaIx } = await ensureATA(
        publicKey,
        CUSTOM_TOKEN_MINT,
        sponsor.publicKey
      );
      if (createAtaIx) ixs.push(createAtaIx);

      const sponsorAta = await getAssociatedTokenAddress(
        CUSTOM_TOKEN_MINT,
        sponsor.publicKey
      );

      ixs.push(
        createTransferInstruction(
          sponsorAta,
          userAta,
          sponsor.publicKey,
          tokensAmount * 10 ** TOKEN_DECIMALS,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      return sendSponsored(ixs);
    },
    [publicKey, ensureATA, sendSponsored]
  );

  // ==========================================================================
  // 2. INITIALIZE VAULT  (admin-only, one-time)
  // ==========================================================================

  const initializeVault = useCallback(
    async (
      profitSplitPercentage: number,
      vaultTokenAccountKeypair?: Keypair
    ): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');

      const sponsor = getSponsorKeypair();
      if (!sponsor) throw new Error('Sponsor not configured');

      const vtaKp = vaultTokenAccountKeypair ?? Keypair.generate();

      const ix = await (program.methods as any)
        .initializeVault(profitSplitPercentage)
        .accounts({
          vaultState: vaultStatePDA,
          usdcMint: CUSTOM_TOKEN_MINT,
          vaultTokenAccount: vtaKp.publicKey,
          oracleAdmin: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      return sendSponsored([ix], [vtaKp]);
    },
    [publicKey, program, vaultStatePDA, sendSponsored]
  );

  // ==========================================================================
  // 3. DEPOSIT (Co-Invest) — user sends tokens into the vault
  // ==========================================================================

  const deposit = useCallback(
    async (uiAmount: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (uiAmount <= 0) throw new Error('Amount must be > 0');

      // Resolve vault token account (the ATA owned by vaultState PDA)
      const { ata: vaultAta } = await ensureATA(
        vaultStatePDA,
        CUSTOM_TOKEN_MINT
      );

      const userAta = await getAssociatedTokenAddress(
        CUSTOM_TOKEN_MINT,
        publicKey
      );

      const [userAccountPDA] = deriveUserAccountPDA(publicKey);

      const amount = new BN(uiAmount * 10 ** TOKEN_DECIMALS);

      const ix = await (program.methods as any)
        .deposit(amount)
        .accounts({
          vaultState: vaultStatePDA,
          vaultTokenAccount: vaultAta,
          userAccount: userAccountPDA,
          userTokenAccount: userAta,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      return sendSponsored([ix]);
    },
    [publicKey, program, vaultStatePDA, ensureATA, sendSponsored]
  );

  // ==========================================================================
  // 4. WITHDRAW — user pulls tokens (principal + accrued revenue) from vault
  // ==========================================================================

  const withdraw = useCallback(
    async (uiAmount: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (uiAmount <= 0) throw new Error('Amount must be > 0');

      const { ata: vaultAta } = await ensureATA(
        vaultStatePDA,
        CUSTOM_TOKEN_MINT
      );

      const userAta = await getAssociatedTokenAddress(
        CUSTOM_TOKEN_MINT,
        publicKey
      );

      const [userAccountPDA] = deriveUserAccountPDA(publicKey);

      const amount = new BN(uiAmount * 10 ** TOKEN_DECIMALS);

      const ix = await (program.methods as any)
        .withdraw(amount)
        .accounts({
          vaultState: vaultStatePDA,
          vaultTokenAccount: vaultAta,
          userAccount: userAccountPDA,
          userTokenAccount: userAta,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      return sendSponsored([ix]);
    },
    [publicKey, program, vaultStatePDA, ensureATA, sendSponsored]
  );

  // ==========================================================================
  // 5. REPORT & DISTRIBUTE — oracle admin reports profit, revenue auto-splits
  // ==========================================================================

  const reportAndDistribute = useCallback(
    async (totalProfitUi: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');

      const totalProfit = new BN(totalProfitUi * 10 ** TOKEN_DECIMALS);

      const ix = await (program.methods as any)
        .reportAndDistribute(totalProfit)
        .accounts({
          vaultState: vaultStatePDA,
          oracleAdmin: publicKey,
        })
        .instruction();

      return sendSponsored([ix]);
    },
    [publicKey, program, vaultStatePDA, sendSponsored]
  );

  // ==========================================================================
  // 6. CIRCUIT BREAKER — pause / unpause vault (oracle admin only)
  // ==========================================================================

  const triggerCircuitBreaker = useCallback(async (): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');

    const ix = await (program.methods as any)
      .triggerCircuitBreaker()
      .accounts({
        vaultState: vaultStatePDA,
        oracleAdmin: publicKey,
      })
      .instruction();

    return sendSponsored([ix]);
  }, [publicKey, program, vaultStatePDA, sendSponsored]);

  const resolveCircuitBreaker = useCallback(async (): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');

    const ix = await (program.methods as any)
      .resolveCircuitBreaker()
      .accounts({
        vaultState: vaultStatePDA,
        oracleAdmin: publicKey,
      })
      .instruction();

    return sendSponsored([ix]);
  }, [publicKey, program, vaultStatePDA, sendSponsored]);

  // ==========================================================================
  // READ HELPERS — fetch on-chain state
  // ==========================================================================

  /** Fetch the global VaultState account */
  const fetchVaultState = useCallback(async (): Promise<VaultStateAccount | null> => {
    try {
      const data = await (program.account as any).vaultState.fetch(vaultStatePDA);
      return data as VaultStateAccount;
    } catch {
      return null;
    }
  }, [program, vaultStatePDA]);

  /** Fetch the calling user's UserAccount PDA data */
  const fetchUserAccount = useCallback(async (): Promise<UserAccountData | null> => {
    if (!publicKey) return null;
    try {
      const [pda] = deriveUserAccountPDA(publicKey);
      const data = await (program.account as any).userAccount.fetch(pda);
      return data as UserAccountData;
    } catch {
      return null;
    }
  }, [publicKey, program]);

  /** Fetch the user's SPL token balance (UI amount) */
  const getUserBalance = useCallback(async (): Promise<number> => {
    if (!publicKey) return 0;
    try {
      const ata = await getAssociatedTokenAddress(CUSTOM_TOKEN_MINT, publicKey);
      const account = await getAccount(connection, ata);
      return Number(account.amount) / 10 ** TOKEN_DECIMALS;
    } catch {
      return 0;
    }
  }, [publicKey, connection]);

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    // ---- Transactions ----
    fundUserAccount,
    initializeVault,
    deposit,
    withdraw,
    reportAndDistribute,
    triggerCircuitBreaker,
    resolveCircuitBreaker,

    // ---- Read helpers ----
    fetchVaultState,
    fetchUserAccount,
    getUserBalance,

    // ---- Metadata ----
    programId: PROGRAM_ID,
    tokenMint: CUSTOM_TOKEN_MINT,
    vaultStatePDA,
    isReady: !!publicKey && !!getSponsorKeypair(),
    sponsorConfigured: !!getSponsorKeypair(),
  };
}
