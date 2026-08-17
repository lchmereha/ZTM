import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { ProdutoService } from './produto.service';

@Controller('produto')
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  create(
    @Body() createProdutoDto: CreateProdutoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.produtoService.create(
      createProdutoDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(
    @Body() datatablesRequest: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.produtoService.datatables(
      datatablesRequest,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get('combo')
  combo(
    @Req() req: AuthenticatedRequest,
    @Query('idEmpresa') idEmpresa?: string,
  ) {
    return this.produtoService.combo(
      req.user.sub,
      req.user.regra,
      idEmpresa ? Number(idEmpresa) : undefined,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('idEmpresa') idEmpresa?: string,
  ) {
    return this.produtoService.findAll(
      req.user.sub,
      req.user.regra,
      idEmpresa ? Number(idEmpresa) : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.produtoService.findOne(id, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProdutoDto: UpdateProdutoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.produtoService.update(
      id,
      updateProdutoDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.produtoService.remove(id, req.user.sub, req.user.regra);
  }
}
