import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({ example: 'cmtdj6tv00000ys8fr41ik0bg' })
  @IsString()
  orderId: string;
}