import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-700">
        Página {currentPage} de {totalPages}
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious} size="sm">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button variant="outline" onClick={onNext} disabled={!hasNext} size="sm">
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
