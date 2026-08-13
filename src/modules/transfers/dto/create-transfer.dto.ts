import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria de origen (UUID)', example: 'uuid-cuenta-origen' })
  @IsUUID('4', { message: 'El ID de la cuenta de origen debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'La cuenta de origen es requerida' })
  fromAccountId: string;

  @ApiProperty({
    description: 'ID de la cuenta de destino o Código IBAN de destino',
    example: 'ES4421000418405556667778',
  })
  @IsString()
  @IsNotEmpty({ message: 'El destino de la transferencia es requerido' })
  destination: string;

  @ApiProperty({
    description: 'Importe en euros a transferir (Ej. 150.50)',
    example: 150.50,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'El importe debe ser un número válido' })
  @IsPositive({ message: 'El importe debe ser estrictamente mayor a cero' })
  @Min(0.01, { message: 'El importe mínimo es de 0.01 EUR' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Concepto o descripción de la transferencia',
    example: 'Pago de servicios y consultoría',
    default: 'Transferencia bancaria ordinaria',
  })
  @IsString()
  description?: string = 'Transferencia bancaria ordinaria';
}
