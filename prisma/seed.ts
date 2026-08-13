import { PrismaClient, Role, AccountType, TransactionType, EntryType, CardType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando sembrado de datos bancarios para NovaBank Core...');

  // 1. Limpieza segura en cascada (para desarrollo)
  await prisma.auditLog.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.exchangeRate.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Creación de Usuarios con Roles Bancarios
  console.log('👤 Creando usuarios y roles...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@novabank.es',
      passwordHash,
      firstName: 'Carlos',
      lastName: 'Administrador',
      nationalId: '00000001A',
      role: Role.ADMIN,
    },
  });

  const auditorUser = await prisma.user.create({
    data: {
      email: 'auditor@novabank.es',
      passwordHash,
      firstName: 'Elena',
      lastName: 'Auditora Compliance',
      nationalId: '00000002B',
      role: Role.AUDITOR,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      email: 'cajero@novabank.es',
      passwordHash,
      firstName: 'Marcos',
      lastName: 'Cajero Ventanilla',
      nationalId: '00000003C',
      role: Role.CAJERO,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'gerente@novabank.es',
      passwordHash,
      firstName: 'Laura',
      lastName: 'Gerente Sucursal',
      nationalId: '00000004D',
      role: Role.GERENTE,
    },
  });

  const clientUser1 = await prisma.user.create({
    data: {
      email: 'cliente@novabank.es',
      passwordHash,
      firstName: 'Alejandro',
      lastName: 'Navarro Sanz',
      nationalId: '48920193X',
      role: Role.CLIENTE,
    },
  });

  const clientUser2 = await prisma.user.create({
    data: {
      email: 'maria.garcia@novabank.es',
      passwordHash,
      firstName: 'María',
      lastName: 'García López',
      nationalId: '52819034Y',
      role: Role.CLIENTE,
    },
  });

  // 3. Creación de Cuenta Interna de la Bóveda del Banco (Partida Doble para Fondos Centrales)
  console.log('🏦 Creando cuentas bancarias e IBANs...');
  const vaultAccount = await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountNumber: 'ES9121000418450200051332',
      accountType: AccountType.INTERNAL_BANK,
      currency: 'EUR',
      balanceCents: BigInt(100000000000), // 1.000.000.000,00 EUR (Bóveda central de liquidez)
    },
  });

  // Cuentas de clientes
  const client1Checking = await prisma.account.create({
    data: {
      userId: clientUser1.id,
      accountNumber: 'ES6621000418401234567891',
      accountType: AccountType.CHECKING,
      currency: 'EUR',
      balanceCents: BigInt(1545000), // 15.450,00 EUR
    },
  });

  const client1Savings = await prisma.account.create({
    data: {
      userId: clientUser1.id,
      accountNumber: 'ES8221000418409876543210',
      accountType: AccountType.SAVINGS,
      currency: 'EUR',
      balanceCents: BigInt(5000000), // 50.000,00 EUR
    },
  });

  const client2Checking = await prisma.account.create({
    data: {
      userId: clientUser2.id,
      accountNumber: 'ES4421000418405556667778',
      accountType: AccountType.CHECKING,
      currency: 'EUR',
      balanceCents: BigInt(820000), // 8.200,00 EUR
    },
  });

  // 4. Tarjetas bancarias asociadas
  console.log('💳 Emitiendo tarjetas bancarias de prueba...');
  await prisma.card.create({
    data: {
      accountId: client1Checking.id,
      maskedPan: '4532 **** **** 8821',
      panHash: await bcrypt.hash('4532890123458821', 8),
      cardType: CardType.DEBIT,
      expirationDate: new Date('2028-12-31'),
      dailyLimitCents: 150000, // 1500.00 EUR
    },
  });

  // 5. Asientos Contables de Apertura (Double-Entry Ledger Inmutable)
  console.log('⚖️ Generando asientos contables iniciales en el Libro Mayor...');
  const initTx = await prisma.transaction.create({
    data: {
      referenceCode: 'TX-20260814-INIT01',
      type: TransactionType.DEPOSIT,
      amountCents: BigInt(1545000),
      currency: 'EUR',
      description: 'Depósito inicial de apertura de cuenta corriente',
      createdBy: cashierUser.id,
    },
  });

  // Asiento Débito (Bóveda / Caja) y Crédito (Cuenta Cliente)
  await prisma.journalEntry.createMany({
    data: [
      {
        transactionId: initTx.id,
        accountId: vaultAccount.id,
        entryType: EntryType.DEBIT,
        amountCents: BigInt(1545000),
        balanceAfterCents: vaultAccount.balanceCents,
      },
      {
        transactionId: initTx.id,
        accountId: client1Checking.id,
        entryType: EntryType.CREDIT,
        amountCents: BigInt(1545000),
        balanceAfterCents: client1Checking.balanceCents,
      },
    ],
  });

  // 6. Tipos de Cambio de Divisas (Forex)
  console.log('💱 Sembrando catálogo de divisas y tipos de cambio...');
  const rates = [
    { baseCurrency: 'EUR', targetCurrency: 'USD', rate: 1.0855 },
    { baseCurrency: 'EUR', targetCurrency: 'GBP', rate: 0.8542 },
    { baseCurrency: 'EUR', targetCurrency: 'MXN', rate: 20.452 },
    { baseCurrency: 'EUR', targetCurrency: 'COP', rate: 4350.75 },
    { baseCurrency: 'USD', targetCurrency: 'EUR', rate: 0.9212 },
    { baseCurrency: 'GBP', targetCurrency: 'EUR', rate: 1.1706 },
  ];

  for (const r of rates) {
    await prisma.exchangeRate.create({
      data: {
        baseCurrency: r.baseCurrency,
        targetCurrency: r.targetCurrency,
        rate: r.rate,
      },
    });
  }

  // 7. Registro de Auditoría Inicial
  console.log('🛡️ Registrando logs de auditoría iniciales...');
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_SEED_INITIALIZED',
      resource: 'Database',
      resourceId: 'ALL',
      ipAddress: '127.0.0.1',
      userAgent: 'NovaBank Seed Engine 1.0',
      metadata: { status: 'SUCCESS', seededAccounts: 4, seededUsers: 6 },
    },
  });

  console.log('✅ Sembrado completado con éxito.');
  console.log('   Credenciales de prueba:');
  console.log('   - Administrador: admin@novabank.es / Password123!');
  console.log('   - Cliente:       cliente@novabank.es / Password123!');
  console.log('   - Cajero:        cajero@novabank.es / Password123!');
  console.log('   - Auditor:       auditor@novabank.es / Password123!');
  console.log('   - Gerente:       gerente@novabank.es / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
