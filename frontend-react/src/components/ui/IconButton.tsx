import { ReactNode } from 'react';

interface IconButtonProps {
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'ghost' | 'primary' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: ReactNode;
}

export function IconButton({
  ariaLabel,
  onClick,
  disabled,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
}: IconButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg transition-colors';
  const sizes = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const variants = {
    ghost: 'text-gray-600 hover:bg-gray-100',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    primary: 'bg-primary text-white hover:bg-primary-dark',
    danger: 'text-red-600 hover:bg-red-50',
  }[variant];

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${variants} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
