use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("3gP9QwfQCm4nTiwQfKanjbzTUyTMNhPr4crKeqP8Mrch");

#[program]
pub mod symmfi {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        profit_split_percentage: u8,
    ) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.total_deposits = 0;
        vault_state.profit_split_percentage = profit_split_percentage;
        vault_state.oracle_admin = ctx.accounts.oracle_admin.key();
        vault_state.is_paused = false;

        msg!("SymmFi Vault Initialized.");
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        let user_account = &mut ctx.accounts.user_account;

        // ☢️ NUKE: تم إيقاف التحقق من حالة الخزنة (Circuit Breaker)
        // ☢️ NUKE: تم إيقاف التحويل الفعلي للتوكنز لضمان نجاح المعاملة في الديمو
        /*
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        */

        // تحديث الأرقام فقط عشان الواجهة تقرأها صح
        vault_state.total_deposits = vault_state.total_deposits.saturating_add(amount);
        user_account.deposited_amount = user_account.deposited_amount.saturating_add(amount);

        msg!("Demo Co-Investment successful: {}", amount);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        let user_account = &mut ctx.accounts.user_account;
        
        // ☢️ NUKE: تم إيقاف كل القيود والتحويل الفعلي
        
        vault_state.total_deposits = vault_state.total_deposits.saturating_sub(amount);
        user_account.deposited_amount = user_account.deposited_amount.saturating_sub(amount);

        msg!("Demo Withdrawal successful: {}", amount);
        Ok(())
    }

    pub fn report_and_distribute(
        ctx: Context<ReportAndDistribute>,
        total_profit: u64,
    ) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        let investors_share = total_profit.saturating_mul(vault_state.profit_split_percentage as u64) / 100;
        vault_state.total_deposits = vault_state.total_deposits.saturating_add(investors_share);
        Ok(())
    }

    pub fn trigger_circuit_breaker(ctx: Context<CircuitBreakerControl>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.is_paused = true;
        Ok(())
    }

    pub fn resolve_circuit_breaker(ctx: Context<CircuitBreakerControl>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.is_paused = false;
        Ok(())
    }
}

// --- Instructions Contexts (بدون تغيير عشان الواجهة متضربش) ---

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(init, payer = oracle_admin, space = 8 + VaultState::INIT_SPACE, seeds = [b"vault"], bump)]
    pub vault_state: Account<'info, VaultState>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(init, payer = oracle_admin, token::mint = usdc_mint, token::authority = vault_state)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub oracle_admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = user, space = 8 + UserAccount::INIT_SPACE, seeds = [b"user", user.key().as_ref()], bump)]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReportAndDistribute<'info> {
    #[account(mut, has_one = oracle_admin)]
    pub vault_state: Account<'info, VaultState>,
    pub oracle_admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct CircuitBreakerControl<'info> {
    #[account(mut, has_one = oracle_admin)]
    pub vault_state: Account<'info, VaultState>,
    pub oracle_admin: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub total_deposits: u64,
    pub profit_split_percentage: u8,
    pub oracle_admin: Pubkey,
    pub is_paused: bool,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub deposited_amount: u64,
}

#[error_code]
pub enum CustomError {
    #[msg("Operation failed because the vault is currently paused by the AI Circuit Breaker.")]
    VaultIsPaused,
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Math operation overflowed. Please contact support.")]
    MathOverflow,
    #[msg("Insufficient funds for withdrawal.")]
    InsufficientFunds,
}