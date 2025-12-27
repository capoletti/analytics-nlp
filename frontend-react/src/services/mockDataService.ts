import { DashboardData } from '@/types/dashboard';

export function generateMockData(tenant: string): DashboardData[] {
  const data: DashboardData[] = [];
  const startDate = new Date('2024-07-01');
  const endDate = new Date('2024-12-31');
  const categorias = ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros'];
  const regioes = ['Sul', 'Sudeste', 'Norte', 'Nordeste', 'Centro-Oeste'];
  const canais = ['Online', 'Loja Física', 'Marketplace'];

  let numOrders = 60;
  if (tenant === 'empresa1') numOrders = 100;
  else if (tenant === 'empresa2') numOrders = 80;

  for (let i = 0; i < numOrders; i++) {
    const date = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    data.push({
      id: i + 1,
      data: date.toISOString().split('T')[0],
      cliente: `Cliente ${i + 1}`,
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      regiao: regioes[Math.floor(Math.random() * regioes.length)],
      canal: canais[Math.floor(Math.random() * canais.length)],
      valor: Math.floor(Math.random() * 5000) + 500,
    });
  }

  return data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}
