import { IbanUtil } from '../src/common/utils/iban.util';

describe('IbanUtil (Pruebas Unitarias)', () => {
  it('debe generar un IBAN español válido con formato correcto', () => {
    const iban = IbanUtil.generateSpanishIban('2100', '0418');
    expect(iban).toMatch(/^ES\d{22}$/);
    expect(IbanUtil.isValidIban(iban)).toBe(true);
  });

  it('debe validar correctamente IBANs legítimos', () => {
    const validIban = 'ES9121000418450200051332';
    expect(IbanUtil.isValidIban(validIban)).toBe(true);
  });

  it('debe rechazar IBANs con dígitos de control alterados', () => {
    const invalidIban = 'ES9921000418450200051332'; // Dígitos de control cambiados de 91 a 99
    expect(IbanUtil.isValidIban(invalidIban)).toBe(false);
  });

  it('debe formatear el IBAN con espacios legibles cada 4 caracteres', () => {
    const raw = 'ES9121000418450200051332';
    const formatted = IbanUtil.formatIban(raw);
    expect(formatted).toBe('ES91 2100 0418 4502 0005 1332');
  });
});
