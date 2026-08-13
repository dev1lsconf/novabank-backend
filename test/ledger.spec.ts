import { LedgerService } from '../src/modules/ledger/ledger.service';
import { EntryType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('LedgerService (Motor de Partida Doble)', () => {
  let ledgerService: LedgerService;
  const mockPrismaService = {} as any;

  beforeEach(() => {
    ledgerService = new LedgerService(mockPrismaService);
  });

  it('debe aceptar asientos contables estrictamente balanceados: Débito == Crédito', () => {
    const postings = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: 15000n },
      { accountId: 'acc-2', entryType: EntryType.CREDIT, amountCents: 15000n },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(postings)).not.toThrow();
  });

  it('debe rechazar asientos con descuadre contable (Débito != Crédito)', () => {
    const unbalancedPostings = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: 15000n },
      { accountId: 'acc-2', entryType: EntryType.CREDIT, amountCents: 10000n },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(unbalancedPostings)).toThrow(BadRequestException);
  });

  it('debe rechazar importes negativos o iguales a cero', () => {
    const negativePostings = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: -500n },
      { accountId: 'acc-2', entryType: EntryType.CREDIT, amountCents: -500n },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(negativePostings)).toThrow(BadRequestException);
  });

  it('debe rechazar asientos que no contengan al menos dos cuentas', () => {
    const singlePosting = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: 1000n },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(singlePosting)).toThrow(BadRequestException);
  });
});
