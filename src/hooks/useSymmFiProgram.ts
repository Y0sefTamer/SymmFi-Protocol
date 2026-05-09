import { useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// 1. هنا خلينا الكود يقرأ التوكن بتاعك إنت من الـ env
const TOKEN_MINT = new PublicKey(
  (import.meta as any).env.VITE_CUSTOM_TOKEN_MINT || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
);
const TOKEN_DECIMALS = 6;

const VAULT_WALLET = new PublicKey(
  'GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR'
);

function getSponsorKeypair(): Keypair | null {
  try {
    const secretKeyStr = (import.meta as any).env.VITE_SPONSOR_SECRET_KEY;
    if (!secretKeyStr) return null;
    const secretKey = JSON.parse(secretKeyStr) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch {
    console.warn('Sponsor keypair not configured or invalid');
    return null;
  }
}

export function useSymmFiProgram() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const getOrCreateATA = useCallback(
    async (owner: PublicKey, mint: PublicKey) => {
      const ata = await getAssociatedTokenAddress(mint, owner);
      try {
        await getAccount(connection, ata);
        return { ata, instruction: null };
      } catch {
        const instruction = createAssociatedTokenAccountInstruction(
          publicKey || owner, // خلينا المستخدم هو اللي يدفع رسوم فتح الحساب عشان فانتوم متضربش
          ata,
          owner,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return { ata, instruction };
      }
    },
    [connection, publicKey]
  );

  const sendSponsoredTransaction = useCallback(
    async (buildInstructions: () => Promise<{ instructions: any[]; signers?: Keypair[] }>) => {
      if (!publicKey) throw new Error('Wallet not connected');

      const { instructions, signers } = await buildInstructions();

      const transaction = new Transaction();
      instructions.forEach((ix) => transaction.add(ix));

      const signature = await sendTransaction(transaction, connection, {
        signers: signers || [], 
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      return signature;
    },
    [connection, publicKey, sendTransaction]
  );

  const fundUserAccount = useCallback(async (): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');
    const sponsor = getSponsorKeypair();
    if (!sponsor) throw new Error('Sponsor not configured');

    return sendSponsoredTransaction(async () => {
      const instructions: any[] = [];
      const { ata: userAta, instruction: createUserAtaIx } = await getOrCreateATA(publicKey, TOKEN_MINT);
      if (createUserAtaIx) instructions.push(createUserAtaIx);

      const sponsorAta = await getAssociatedTokenAddress(TOKEN_MINT, sponsor.publicKey);
      const amount = 1000 * 10 ** TOKEN_DECIMALS;
      instructions.push(
        createTransferInstruction(
          sponsorAta,
          userAta,
          sponsor.publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // 2. التعديل السحري: ضفنا إمضاء الراعي هنا
      return { instructions, signers: [sponsor] };
    });
  }, [publicKey, sendSponsoredTransaction, getOrCreateATA]);

  const depositToVault = useCallback(
    async (amount: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (amount <= 0) throw new Error('Amount must be greater than 0');

      return sendSponsoredTransaction(async () => {
        const instructions: any[] = [];
        const userAta = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
        const { ata: vaultAta, instruction: createVaultAtaIx } = await getOrCreateATA(VAULT_WALLET, TOKEN_MINT);
        if (createVaultAtaIx) instructions.push(createVaultAtaIx);

        const tokenAmount = amount * 10 ** TOKEN_DECIMALS;
        instructions.push(
          createTransferInstruction(
            userAta,
            vaultAta,
            publicKey,
            tokenAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        return { instructions, signers: [] };
      });
    },
    [publicKey, sendSponsoredTransaction, getOrCreateATA]
  );

  const withdrawFromVault = useCallback(
    async (amount: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (amount <= 0) throw new Error('Amount must be greater than 0');
      const sponsor = getSponsorKeypair();
      if (!sponsor) throw new Error('Sponsor not configured');

      return sendSponsoredTransaction(async () => {
        const instructions: any[] = [];
        const userAta = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
        const sponsorAta = await getAssociatedTokenAddress(TOKEN_MINT, sponsor.publicKey);

        const yieldMultiplier = 1.05;
        const tokenAmount = Math.floor(amount * yieldMultiplier * 10 ** TOKEN_DECIMALS);
        instructions.push(
          createTransferInstruction(
            sponsorAta,
            userAta,
            sponsor.publicKey,
            tokenAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        // التعديل هنا كمان
        return { instructions, signers: [sponsor] };
      });
    },
    [publicKey, sendSponsoredTransaction]
  );

  const borrowFunds = useCallback(
    async (amount: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (amount <= 0) throw new Error('Amount must be greater than 0');
      const sponsor = getSponsorKeypair();
      if (!sponsor) throw new Error('Sponsor not configured');

      return sendSponsoredTransaction(async () => {
        const instructions: any[] = [];
        const { ata: userAta, instruction: createUserAtaIx } = await getOrCreateATA(publicKey, TOKEN_MINT);
        if (createUserAtaIx) instructions.push(createUserAtaIx);

        const sponsorAta = await getAssociatedTokenAddress(TOKEN_MINT, sponsor.publicKey);
        const tokenAmount = amount * 10 ** TOKEN_DECIMALS;
        instructions.push(
          createTransferInstruction(
            sponsorAta,
            userAta,
            sponsor.publicKey,
            tokenAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        // التعديل هنا
        return { instructions, signers: [sponsor] };
      });
    },
    [publicKey, sendSponsoredTransaction, getOrCreateATA]
  );

  const getUserBalance = useCallback(async (): Promise<number> => {
    if (!publicKey) return 0;
    try {
      const ata = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
      const account = await getAccount(connection, ata);
      return Number(account.amount) / 10 ** TOKEN_DECIMALS;
    } catch {
      return 0;
    }
  }, [publicKey, connection]);

  return {
    fundUserAccount,
    depositToVault,
    withdrawFromVault,
    borrowFunds,
    getUserBalance,
    tokenMint: TOKEN_MINT,
    isReady: !!publicKey && !!getSponsorKeypair(),
    sponsorConfigured: !!getSponsorKeypair(),
  };
}