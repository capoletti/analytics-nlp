import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
  icon?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({ text, icon, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div className="relative inline-flex items-center" ref={tooltipRef}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="ml-1 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Mais informações"
      >
        {icon || <HelpCircle className="h-4 w-4" />}
      </button>

      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} z-50 w-48 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg`}
        >
          {text}
          <div
            className={`absolute h-2 w-2 bg-white ${
              position === 'top' ? 'bottom-0 left-4 -mb-1 border-r border-b border-gray-200' :
              position === 'bottom' ? 'top-0 left-4 -mt-1 border-l border-t border-gray-200' :
              position === 'left' ? 'right-0 top-2 -mr-1 border-t border-r border-gray-200' :
              'left-0 top-2 -ml-1 border-b border-l border-gray-200'
            }`}
          />
        </div>
      )}
    </div>
  );
}
