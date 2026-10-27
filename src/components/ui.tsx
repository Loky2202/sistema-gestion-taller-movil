import React from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================
// COMPONENTES UI REUTILIZABLES
// ============================================================

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white active:bg-blue-700 shadow-lg shadow-blue-600/20',
    secondary: 'bg-gray-100 text-gray-800 active:bg-gray-200 border border-gray-200',
    danger: 'bg-red-600 text-white active:bg-red-700',
    ghost: 'bg-transparent text-gray-600 active:bg-gray-100',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]',
  };

  return (
    <button
      className={`rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// --- StatusBadge ---
import type { EstadoOrden } from '../types';

const estadoConfig: Record<EstadoOrden, { label: string; color: string; bg: string }> = {
  recibido: { label: 'Recibido', color: 'text-blue-700', bg: 'bg-blue-100' },
  en_reparacion: { label: 'En reparación', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  esperando_repuesto: { label: 'Esperando repuesto', color: 'text-orange-700', bg: 'bg-orange-100' },
  listo: { label: 'Listo', color: 'text-green-700', bg: 'bg-green-100' },
  entregado: { label: 'Entregado', color: 'text-gray-600', bg: 'bg-gray-100' },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
};

export function StatusBadge({ estado }: { estado: EstadoOrden }) {
  const config = estadoConfig[estado] ?? {
    label: estado ?? 'Sin estado',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

// --- StockBadge ---
export function StockBadge({ actual, minimo }: { actual: number; minimo: number }) {
  const isLow = actual <= minimo;
  const isCritical = actual === 0;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isCritical ? 'bg-red-100 text-red-700' : isLow ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
      {actual} uds.
    </span>
  );
}

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// --- EmptyState ---
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// --- Loader ---
export function Loader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm text-gray-500">{text}</p>
    </div>
  );
}

// --- Toast ---
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg text-center font-medium animate-fade-in`}>
      {message}
    </div>
  );
}

// --- OfflineBanner ---
export function OfflineBanner() {
  return (
    <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
      📡 Sin conexión con el servidor del taller
    </div>
  );
}

// --- FAB (Floating Action Button) ---
interface FabProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
}

export function Fab({ onClick, icon, label }: FabProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 px-4 py-4 min-h-[56px] active:scale-95 transition-transform"
    >
      {icon}
      {label && <span className="font-semibold">{label}</span>}
    </button>
  );
}

// --- PageHeader ---
interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export function PageHeader({ title, onBack, action }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-900 flex-1">{title}</h1>
      {action}
    </div>
  );
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

/**
 * El backend devuelve fechas en UTC sin sufijo de zona (ej. 2026-10-27T20:15:00).
 * JavaScript las interpretaría como hora local, así que añadimos la "Z".
 */
export function parseApiDate(value: string): Date {
  const hasTime = value.includes('T');
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasTime && !hasTimezone ? `${value}Z` : value);
}

/** Fecha local en formato YYYY-MM-DD (para comparar con el "hoy" del taller). */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = parseApiDate(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const date = parseApiDate(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
