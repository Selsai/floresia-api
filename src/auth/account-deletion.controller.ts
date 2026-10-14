import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountDeletionService } from './account-deletion.service';
import {
  DeleteAccountDto,
  DeletionDocumentDto,
  DeletionTokenDto,
} from './dto/account-deletion.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from './decorators/current-user.decorator';
import { PaymentService } from '../payment/payment.service';

@ApiTags('Authentication')
@Controller('auth/deletion')
export class AccountDeletionController {
  constructor(
    private readonly deletion: AccountDeletionService,
    private readonly payment: PaymentService,
  ) {}
  @Post('request')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Désactiver le compte après vérification du mot de passe',
  })
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.deletion.requestDeletion(user.userId, dto.password);
  }
  @Post('access')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Accès limité aux factures pendant les 30 jours de récupération',
  })
  access(@Body() dto: DeletionTokenDto) {
    return this.deletion.access(dto.token);
  }
  @Post('document')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Ouvrir une facture appartenant au compte désactivé',
  })
  async document(@Body() dto: DeletionDocumentDto) {
    const user = await this.deletion.verifyAccess(dto.token);
    return this.payment.getOrderDocument(dto.orderId, user.id);
  }
  @Post('restore')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Réactiver le compte et définir obligatoirement un nouveau mot de passe',
  })
  restore(@Body() dto: ResetPasswordDto) {
    return this.deletion.restore(dto.token, dto.newPassword);
  }
}
