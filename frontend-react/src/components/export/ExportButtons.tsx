import { FileText, File } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import type { DashboardData } from '@/types/dashboard';

interface ExportButtonsProps {
  data: DashboardData[];
}

export function ExportButtons({ data }: ExportButtonsProps) {
  const { tenant } = useAuth();
  const { showToast } = useToast();

  const exportCSV = () => {
    let csv = 'Data,Cliente,Categoria,Região,Canal,Valor\n';
    data.forEach((item) => {
      csv += `${item.data},${item.cliente},${item.categoria},${item.regiao},${item.canal},${item.valor}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${tenant}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV exportado com sucesso!', 'success');
  };

  const exportPDF = () => {
    window.print();
    showToast('Use a função de impressão para salvar como PDF', 'info');
  };

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={exportCSV} size="sm">
        <FileText className="h-4 w-4" />
        CSV
      </Button>
      <Button variant="secondary" onClick={exportPDF} size="sm">
        <File className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
