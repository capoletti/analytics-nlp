import { ButtonHTMLAttributes } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } & ButtonHTMLAttributes<HTMLButtonElement>;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 text-center">{description}</p>}
      {action && (() => {
        const { label, onClick, ...buttonProps } = action;
        return (
          <button onClick={onClick} className="btn btn-primary" {...buttonProps}>
            {label}
          </button>
        );
      })()}
    </div>
  );
}
