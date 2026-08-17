import * as dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }
  const dbUrl = new URL(connectionString);
  const poolConfig = {
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  };
  const adapter = new PrismaMariaDb(poolConfig);
  const prisma = new PrismaClient({ adapter });

  // ── Opções de Menu ──────────────────────────────────────
  const menuOptions = [
    { chave: 'CAD_USUARIO', nome: 'Usuários' },
    { chave: 'CAD_EMPRESA', nome: 'Empresas' },
    { chave: 'CAD_FILIAL', nome: 'Filiais' },
    { chave: 'CAD_CATEGORIA', nome: 'Categorias' },
    { chave: 'CAD_PRODUTO', nome: 'Produtos' },
    { chave: 'CAD_ETIQUETA_MODELO', nome: 'Etiquetas' },
    { chave: 'CAD_POSICAO_ESTOQUE', nome: 'Posições de Estoque' },
    { chave: 'CAD_TAG_RFID', nome: 'Tags RFID' },
    { chave: 'CAD_EQUIPAMENTO', nome: 'Equipamentos' },
    { chave: 'CAD_TIPO_MOVIMENTACAO', nome: 'Tipos de Movimentação' },
    { chave: 'MOV_RFID', nome: 'Movimentações' },
    { chave: 'CON_POSICAO_ESTOQUE', nome: 'Posição de Estoque' },
    { chave: 'CON_EXTRATO_MOVIMENTACAO', nome: 'Extrato de Movimentação' },
    { chave: 'CON_ENTRADA_SAIDA', nome: 'Entrada e Saída' },
    { chave: 'CAD_API_KEY', nome: 'API Keys' },
  ];

  console.log('🌱 Semeando Opções de Menu...');
  for (const option of menuOptions) {
    await prisma.opcaoMenu.upsert({
      where: { chave: option.chave },
      update: { nome: option.nome },
      create: {
        chave: option.chave,
        nome: option.nome,
        ativo: true,
      },
    });
  }

  // ── Usuário Admin ──────────────────────────────────────
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    throw new Error('ADMIN_USERNAME or ADMIN_PASSWORD ENV vars are missing.');
  }

  console.log(`🌱 Garantindo usuário admin: ${adminUser}`);
  // O seed roda no docker-entrypoint a cada start do container. Escrever a
  // senha aqui reverteria, a cada restart, qualquer troca feita pelo admin na
  // aplicação. Só o vínculo de papel/ativação é reafirmado; a senha é gravada
  // apenas na criação inicial.
  const user = await prisma.usuario.upsert({
    where: { usuario: adminUser },
    update: {
      regra: 'ADMIN',
      ativo: true,
    },
    create: {
      nome: 'ZZADMIN',
      usuario: adminUser,
      email: null,
      senha: await bcrypt.hash(adminPass, 10),
      regra: 'ADMIN',
      ativo: true,
    },
  });

  console.log('✅ Seed executado com sucesso');
  console.log(
    `   → Usuário ${adminUser} configurado como ADMIN (acesso total implícito).`,
  );

  // Dados fictícios para revisores externos (Google Play). Opt-in explícito:
  // não deve ser habilitado em ambiente de cliente.
  if (process.env.SEED_DEMO === 'true') {
    const { seedDemo } = await import('./seed-demo');
    await seedDemo(prisma);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro no seed:', e);
  process.exit(1);
});
