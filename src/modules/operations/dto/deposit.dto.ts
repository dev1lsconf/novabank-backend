import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria de destino (UUID)', example: 'uuid-cuenta' })
  @IsUUID('4', { message: 'El ID de la cuenta debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la cuenta es requerido' })
  accountId: string;

  @ApiProperty({ description: 'Importe en euros a depositar', example: 500.00, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Concepto del depósito', example: 'Ingreso en efectivo en ventanilla' })
  @IsString()
  description?: string = 'Ingreso en efectivo en ventanilla';
}

export class WithdrawDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria de origen (UUID)', example: 'uuid-cuenta' })
  @IsUUID('4', { message: 'El ID de la cuenta debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la cuenta es requerido' })
  accountId: string;

  @ApiProperty({ description: 'Importe en euros a retirar', example: 100.00, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Concepto del retiro', example: 'Retiro de efectivo en cajero' })
  @IsString()
  description?: string = 'Retiro de efectivo';
}
