import React from 'react';
import type { LucideIcon } from 'lucide-react';

/* ============================================================
   SHARED PRIMITIVES — the visual vocabulary of Heritage Light.
   Every module composes these so the OS feels designed, not generated.
   ============================================================ */

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'gold';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-maroon-600 hover:bg-maroon-500 text-white shadow-md shadow-maroon-600/25',
  secondary: 'bg-white hover:bg-ivory-100 text-stone-700 border border-stone-300 shadow-sm',
  ghost: 'bg-transparent hover:bg-ivory-200 text-stone-600',
  success: 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-md shadow-emerald-700/25',
  danger: 'bg-red-700 hover:bg-red-600 text-white shadow-md shadow-red-700/25',
  gold: 'bg-gold-400 hover:bg-gold-500 text-maroon-900 shadow-md shadow-gold-400/30'
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...rest }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${buttonVariants[variant]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

/* ---------- Badge ---------- */

type BadgeTone = 'neutral' | 'maroon' | 'gold' | 'emerald' | 'amber' | 'red' | 'sky';

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-stone-100 text-stone-600 border-stone-300',
  maroon: 'bg-maroon-50 text-maroon-700 border-maroon-200',
  gold: 'bg-gold-50 text-gold-700 border-gold-300',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  amber: 'bg-amber-50 text-amber-700 border-amber-300',
  red: 'bg-red-50 text-red-700 border-red-300',
  sky: 'bg-sky-50 text-sky-700 border-sky-300'
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeTones[tone]} ${className}`}>
    {children}
  </span>
);

/* ---------- Stat Card ---------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: LucideIcon;
  iconTone?: string;
  valueClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, iconTone = 'text-maroon-600', valueClass = 'text-stone-900' }) => (
  <div className="glass-card p-3.5 rounded-xl space-y-1">
    <div className="flex items-center justify-between text-stone-500">
      <span className="text-[11px] font-semibold">{label}</span>
      {Icon && <Icon className={`w-3.5 h-3.5 ${iconTone}`} />}
    </div>
    <div className={`text-lg font-bold font-mono ${valueClass}`}>{value}</div>
    {sub && <span className="text-[10px] text-stone-500">{sub}</span>}
  </div>
);

/* ---------- Section Card ---------- */

interface SectionCardProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClass?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, action, className = '', bodyClass = '', children }) => (
  <div className={`surface-panel p-5 space-y-4 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">{title}</h3>
        {action}
      </div>
    )}
    <div className={bodyClass}>{children}</div>
  </div>
);

/* ---------- Page Header ---------- */

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 surface-hero p-5">
    <div>
      {eyebrow && <div className="flex items-center gap-2 mb-1.5">{eyebrow}</div>}
      <h2 className="text-xl font-bold text-stone-900 tracking-tight font-display">{title}</h2>
      {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

/* ---------- Empty State ---------- */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6">
    <div className="w-14 h-14 rounded-2xl bg-ivory-200 border border-stone-200 text-stone-400 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-sm font-bold text-stone-800">{title}</h3>
    <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
