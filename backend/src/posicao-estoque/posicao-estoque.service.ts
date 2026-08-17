import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePosicaoEstoqueDto } from './dto/create-posicao-estoque.dto';
import { UpdatePosicaoEstoqueDto } from './dto/update-posicao-estoque.dto';

@Injectable()
export class PosicaoEstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPosicaoEstoqueDto: CreatePosicaoEstoqueDto) {
    return this.prisma.posicaoEstoque.create({
      data: createPosicaoEstoqueDto,
    });
  }

  async findAll(idFilial?: number) {
    return this.prisma.posicaoEstoque.findMany({
      where: idFilial ? { idFilial } : undefined,
      include: {
        filial: true,
      },
    });
  }

  async findOne(id: number) {
    const posicao = await this.prisma.posicaoEstoque.findUnique({
      where: { id },
      include: {
        filial: true,
      },
    });
    if (!posicao) {
      throw new NotFoundException(
        `Posição de Estoque com ID ${id} não encontrada`,
      );
    }
    return posicao;
  }

  async update(id: number, updatePosicaoEstoqueDto: UpdatePosicaoEstoqueDto) {
    await this.findOne(id);
    return this.prisma.posicaoEstoque.update({
      where: { id },
      data: updatePosicaoEstoqueDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.posicaoEstoque.delete({
      where: { id },
    });
  }
}
