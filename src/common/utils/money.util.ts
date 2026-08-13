/**
 * Utilidad monetaria para operaciones libres de errores de coma flotante.
 * Todos los importes en base de datos se almacenan en céntimos enteros (BigInt).
 */
export class MoneyUtil {
  /**
   * Convierte un número decimal (ej. 154.50) a céntimos enteros (15450)
   */
  static decimalToCents(amount: number): bigint {
    return BigInt(Math.round(amount * 100));
  }

  /**
   * Convierte céntimos enteros (BigInt o number) a número decimal (ej. 15450n -> 154.50)
   */
  static centsToDecimal(cents: bigint | number): number {
    return Number(cents) / 100;
  }

  /**
   * Formatea un importe en céntimos a string con símbolo de divisa (ej. "1.545,50 €")
   */
  static formatCurrency(cents: bigint | number, currency = 'EUR'): string {
    const decimal = this.centsToDecimal(cents);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(decimal);
  }
}
