/**
 * Utilidad bancaria para generación y validación de códigos IBAN según el estándar ISO 13616 / ISO 7064 MOD 97-10.
 */
export class IbanUtil {
  /**
   * Genera un IBAN español válido (ES + 2 dígitos de control + 4 entidad + 4 sucursal + 2 control + 10 cuenta)
   * @param bankCode Código de entidad bancaria (ej. 2100 para NovaBank)
   * @param branchCode Código de sucursal (ej. 0418)
   */
  static generateSpanishIban(bankCode = '2100', branchCode = '0418'): string {
    const randomAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const accountControl = this.calculateSpanishAccountControlDigits(bankCode, branchCode, randomAccountNumber);
    const bban = `${bankCode}${branchCode}${accountControl}${randomAccountNumber}`;
    
    // Convertir ES a valores numéricos (E=14, S=28) + 00
    const numericBban = `${bban}142800`;
    const checksum = 98n - (BigInt(numericBban) % 97n);
    const checksumStr = checksum < 10n ? `0${checksum}` : checksum.toString();
    
    return `ES${checksumStr}${bban}`;
  }

  /**
   * Valida un IBAN internacional
   */
  static isValidIban(iban: string): boolean {
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(clean)) {
      return false;
    }

    const rearranged = clean.slice(4) + clean.slice(0, 4);
    const numeric = rearranged
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      })
      .join('');

    return BigInt(numeric) % 97n === 1n;
  }

  /**
   * Formatea un IBAN con espacios cada 4 dígitos para visualización limpia
   */
  static formatIban(iban: string): string {
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  }

  private static calculateSpanishAccountControlDigits(bank: string, branch: string, account: string): string {
    const weights1 = [4, 8, 5, 10, 9, 7, 3, 6];
    const weights2 = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
    
    const bankBranch = `${bank}${branch}`;
    let sum1 = 0;
    for (let i = 0; i < 8; i++) {
      sum1 += parseInt(bankBranch[i], 10) * weights1[i];
    }
    let digit1 = 11 - (sum1 % 11);
    if (digit1 === 10) digit1 = 1;
    if (digit1 === 11) digit1 = 0;

    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(account[i], 10) * weights2[i];
    }
    let digit2 = 11 - (sum2 % 11);
    if (digit2 === 10) digit2 = 1;
    if (digit2 === 11) digit2 = 0;

    return `${digit1}${digit2}`;
  }
}
