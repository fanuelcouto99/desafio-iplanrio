import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CorridasService } from './corridas.service';
import { Roles } from '../auth/roles.decorator';
import { CriarCorridaDto } from './dto/criar-corrida.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import type { Response } from 'express';
import { AlterarStatusDto } from './dto/alterar-status.dto';

@Controller('corridas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CorridasController {
  constructor(private readonly corridasService: CorridasService) {}

  @Post()
  @Roles('passageiro')
  async criar(
    @Body() dto: CriarCorridaDto,
    @Headers('idempotency-key') idemKey: string | undefined,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!idemKey) {
      throw new BadRequestException('Header idempotency-key é obrigatório');
    }

    const { corrida, replay } = await this.corridasService.criar(
      user,
      dto,
      idemKey,
    );
    res.status(replay ? HttpStatus.OK : HttpStatus.CREATED);
    return corrida;
  }

  @Get()
  @Roles('passageiro')
  listar(@CurrentUser() user: AuthUser) {
    return this.corridasService.listarDoPassageiro(user);
  }

  @Get(':id')
  buscar(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.corridasService.buscar(id, user);
  }

  @Patch(':id/status')
  @Roles('motorista')
  alterar(
    @Param('id') id: string,
    @Body() dto: AlterarStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.corridasService.alterarStatus(id, dto, user);
  }
}
