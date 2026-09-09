import { PrismaClient, StockRole, MovementType, AuditAction } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados Stoker...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Cria usuário Dono
  const owner = await prisma.user.upsert({
    where: { email: 'dono@stoker.com' },
    update: {},
    create: {
      name: 'Carlos Dono',
      email: 'dono@stoker.com',
      password_hash: passwordHash,
    },
  });

  // 2. Cria usuário Convidado
  const guest = await prisma.user.upsert({
    where: { email: 'convidado@stoker.com' },
    update: {},
    create: {
      name: 'Mariana Convidada',
      email: 'convidado@stoker.com',
      password_hash: passwordHash,
    },
  });

  // 3. Cria Estoque Principal
  let stock = await prisma.stock.findFirst({
    where: { share_code: 'STK-CENTRAL' },
  });

  if (!stock) {
    stock = await prisma.stock.create({
      data: {
        name: 'Almoxarifado Central',
        description: 'Estoque principal da matriz com insumos e produtos acabados',
        share_code: 'STK-CENTRAL',
        created_by_id: owner.id,
        allow_negative_stock: false,
      },
    });
  }

  // 4. Vínculos
  await prisma.stockMember.upsert({
    where: {
      stock_id_user_id: { stock_id: stock.id, user_id: owner.id },
    },
    update: {},
    create: {
      stock_id: stock.id,
      user_id: owner.id,
      role: StockRole.OWNER,
    },
  });

  await prisma.stockMember.upsert({
    where: {
      stock_id_user_id: { stock_id: stock.id, user_id: guest.id },
    },
    update: {},
    create: {
      stock_id: stock.id,
      user_id: guest.id,
      role: StockRole.GUEST,
    },
  });

  // 5. Categorias
  const catFerramentas = await prisma.category.upsert({
    where: { stock_id_name: { stock_id: stock.id, name: 'Ferramentas' } },
    update: {},
    create: { stock_id: stock.id, name: 'Ferramentas', color: '#DC2626' },
  });

  const catEletrica = await prisma.category.upsert({
    where: { stock_id_name: { stock_id: stock.id, name: 'Materiais Elétricos' } },
    update: {},
    create: { stock_id: stock.id, name: 'Materiais Elétricos', color: '#F59E0B' },
  });

  const catTintas = await prisma.category.upsert({
    where: { stock_id_name: { stock_id: stock.id, name: 'Tintas & Acabamento' } },
    update: {},
    create: { stock_id: stock.id, name: 'Tintas & Acabamento', color: '#3B82F6' },
  });

  // 6. Itens de exemplo
  const itemFuradeira = await prisma.item.upsert({
    where: { stock_id_sku: { stock_id: stock.id, sku: 'FER-001' } },
    update: {},
    create: {
      stock_id: stock.id,
      category_id: catFerramentas.id,
      name: 'Furadeira de Impacto 750W',
      sku: 'FER-001',
      description: 'Furadeira profissional 127V mandril 1/2',
      unit: 'UN',
      current_quantity: 12,
      min_quantity: 5,
      cost_price: 180.0,
      sale_price: 320.0,
      location: 'Prateleira A-02',
    },
  });

  const itemCabo = await prisma.item.upsert({
    where: { stock_id_sku: { stock_id: stock.id, sku: 'ELE-042' } },
    update: {},
    create: {
      stock_id: stock.id,
      category_id: catEletrica.id,
      name: 'Cabo Flexível 2.5mm Preto',
      sku: 'ELE-042',
      description: 'Rolo de fio flexível 100 metros',
      unit: 'RL',
      current_quantity: 4, // Alerta: abaixo do estoque mínimo
      min_quantity: 10,
      cost_price: 110.0,
      sale_price: 190.0,
      location: 'Corredor B-01',
    },
  });

  const itemTinta = await prisma.item.upsert({
    where: { stock_id_sku: { stock_id: stock.id, sku: 'TIN-108' } },
    update: {},
    create: {
      stock_id: stock.id,
      category_id: catTintas.id,
      name: 'Tinta Acrílica Fosca Branco Neve 18L',
      sku: 'TIN-108',
      description: 'Lata de tinta premium para alvenaria',
      unit: 'LT',
      current_quantity: 25,
      min_quantity: 8,
      cost_price: 240.0,
      sale_price: 390.0,
      location: 'Piso Térreo C-04',
    },
  });

  // 7. Movimentações de demonstração
  await prisma.movement.createMany({
    data: [
      {
        stock_id: stock.id,
        item_id: itemFuradeira.id,
        user_id: owner.id,
        type: MovementType.ENTRADA,
        reason: 'COMPRA',
        quantity: 15,
        previous_quantity: 0,
        new_quantity: 15,
        unit_price: 180.0,
        total_value: 2700.0,
        document_ref: 'NF-10492',
        partner: 'Distribuidora Ferramentas do Brasil',
        notes: 'Lote recebido em perfeito estado',
      },
      {
        stock_id: stock.id,
        item_id: itemFuradeira.id,
        user_id: guest.id,
        type: MovementType.SAIDA,
        reason: 'VENDA',
        quantity: 3,
        previous_quantity: 15,
        new_quantity: 12,
        unit_price: 320.0,
        total_value: 960.0,
        partner: 'Cliente Construtora Horizonte',
        notes: 'Retirada em balcão pelo convidado',
      },
      {
        stock_id: stock.id,
        item_id: itemCabo.id,
        user_id: owner.id,
        type: MovementType.ENTRADA,
        reason: 'COMPRA',
        quantity: 10,
        previous_quantity: 0,
        new_quantity: 10,
        unit_price: 110.0,
        total_value: 1100.0,
        document_ref: 'NF-8821',
        partner: 'Fios & Cabos Ltda',
      },
      {
        stock_id: stock.id,
        item_id: itemCabo.id,
        user_id: guest.id,
        type: MovementType.SAIDA,
        reason: 'CONSUMO_INTERNO',
        quantity: 6,
        previous_quantity: 10,
        new_quantity: 4,
        unit_price: 110.0,
        total_value: 660.0,
        partner: 'Setor de Manutenção Predial',
        notes: 'Instalação elétrica da nova bancada',
      },
    ],
  });

  console.log('Seed do Stoker finalizado com sucesso!');
  console.log('Credenciais de teste:');
  console.log('  Dono:      dono@stoker.com / password123');
  console.log('  Convidado: convidado@stoker.com / password123');
  console.log('  Estoque:   STK-CENTRAL');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

