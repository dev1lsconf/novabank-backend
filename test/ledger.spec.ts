import { LedgerService } from '../src/modules/ledger/ledger.service';
import { EntryType } from '../src/common/enums/entry-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('LedgerService (Motor de Partida Doble)', () => {
  let ledgerService: LedgerService;
  const mockDbService = {} as any;

  beforeEach(() => {
    ledgerService = new LedgerService(mockDbService);
  });

  it('debe aceptar asientos contables estrictamente balanceados: Débito == Crédito', () => {
    const postings = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: 15000 },
      { accountId: 'acc-2', entryType: EntryType.CREDIT, amountCents: 15000 },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(postings)).not.toThrow();
  });

  it('debe rechazar asientos con descuadre contable (Débito != Crédito)', () => {
    const unbalancedPostings = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: 15000 },
      { accountId: 'acc-2', entryType: EntryType.CREDIT, amountCents: 10000 },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(unbalancedPostings)).toThrow(BadRequestException);
  });

  it('debe rechazar importes negativos o iguales a cero', () => {
    const negativePostings = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: -500 },
      { accountId: 'acc-2', entryType: EntryType.CREDIT, amountCents: -500 },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(negativePostings)).toThrow(BadRequestException);
  });

  it('debe rechazar asientos que no contengan al menos dos cuentas', () => {
    const singlePosting = [
      { accountId: 'acc-1', entryType: EntryType.DEBIT, amountCents: 1000 },
    ];

    expect(() => ledgerService.validateDoubleEntryBalance(singlePosting)).toThrow(BadRequestException);
  });
});
