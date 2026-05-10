import React from 'react';
import { BarChart3, Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold">
              <span className="text-gradient">Symm</span>
              <span className="text-foreground">Fi</span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Symmetrical Finance Protocol. Built on Solana. Hackathon Demo.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://x.com/dkyosef200"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
            >
              <Twitter className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://github.com/Y0sefTamer/SymmFi-Protocol"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
