import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const isEmailLogin = dto.tipoLogin === 'EMAIL';

    // Single query with all includes needed for the response
    const user = await this.prisma.usuario.findUnique({
      where: isEmailLogin ? { email: dto.usuario } : { usuario: dto.usuario },
      include: {
        filiaisPermitidas: {
          include: {
            filial: {
              include: {
                empresa: true,
              },
            },
          },
        },
        permissoesUsuario: {
          include: {
            opcaoMenu: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const isPasswordValid = await bcrypt.compare(dto.senha, user.senha);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      username: user.usuario,
      regra: user.regra,
      // Ancora o teto nominal da sessão. A renovação deslizante recria `iat` e
      // `exp` a cada renovação, então só um campo próprio preserva o instante
      // do login original.
      authTime: Math.floor(Date.now() / 1000),
    };

    const isAdmin = user.regra === 'ADMIN';

    // Para ADMIN: buscar todas as empresas e filiais do sistema
    // Para OPERADOR: usar apenas as filiais vinculadas
    let empresas: any[];
    let filiais: any[];
    let empresa: any;

    if (isAdmin) {
      const allEmpresas = await this.prisma.empresa.findMany();
      const allFiliais = await this.prisma.filial.findMany({
        include: { empresa: true },
      });
      empresas = allEmpresas;
      filiais = allFiliais.map((f) => ({
        idFilial: f.id,
        idEmpresa: f.idEmpresa,
        nome: f.nome,
      }));
      empresa = allEmpresas[0] || null;
    } else {
      const empresasMap = new Map();
      user.filiaisPermitidas.forEach((fp) => {
        const emp = fp.filial.empresa;
        if (emp && !empresasMap.has(emp.id)) {
          empresasMap.set(emp.id, emp);
        }
      });
      empresas = Array.from(empresasMap.values());
      filiais =
        user.filiaisPermitidas.map((fp) => ({
          idFilial: fp.idFilial,
          idEmpresa: fp.filial.idEmpresa,
          nome: fp.filial.nome,
        })) || [];
      empresa = user.filiaisPermitidas[0]?.filial?.empresa || null;
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        email: user.email,
        regra: user.regra,
        ativo: user.ativo,
        empresa: empresa
          ? {
              nome: empresa.nome,
              logo: empresa.logo,
              corEsquema: empresa.corEsquema,
            }
          : null,
        empresas: empresas.map((emp) => ({
          id: emp.id,
          nome: emp.nome,
          logo: emp.logo,
          corEsquema: emp.corEsquema,
        })),
        filiais,
        // ADMIN não precisa de permissões — tem acesso total implícito
        permissoes: isAdmin
          ? []
          : user.permissoesUsuario.map((p) => ({
              idOpcaoMenu: p.idOpcaoMenu,
              chave: p.opcaoMenu.chave,
              podeVisualizar: p.podeVisualizar,
              podeIncluir: p.podeIncluir,
              podeAlterar: p.podeAlterar,
              podeExcluir: p.podeExcluir,
            })),
      },
    };
  }

  /**
   * Retorna as empresas e filiais atualizadas do usuário autenticado.
   * Reutiliza a mesma lógica de login() para manter consistência.
   */
  async getMyFiliais(userId: number, regra: string) {
    const isAdmin = regra === 'ADMIN';

    if (isAdmin) {
      const allEmpresas = await this.prisma.empresa.findMany();
      const allFiliais = await this.prisma.filial.findMany({
        include: { empresa: true },
      });
      return {
        empresas: allEmpresas.map((emp) => ({
          id: emp.id,
          nome: emp.nome,
          logo: emp.logo,
          corEsquema: emp.corEsquema,
        })),
        filiais: allFiliais.map((f) => ({
          idFilial: f.id,
          idEmpresa: f.idEmpresa,
          nome: f.nome,
        })),
      };
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        filiaisPermitidas: {
          include: {
            filial: {
              include: { empresa: true },
            },
          },
        },
      },
    });

    if (!user) {
      return { empresas: [], filiais: [] };
    }

    const empresasMap = new Map();
    user.filiaisPermitidas.forEach((fp) => {
      const emp = fp.filial.empresa;
      if (emp && !empresasMap.has(emp.id)) {
        empresasMap.set(emp.id, emp);
      }
    });

    return {
      empresas: Array.from(empresasMap.values()).map((emp) => ({
        id: emp.id,
        nome: emp.nome,
        logo: emp.logo,
        corEsquema: emp.corEsquema,
      })),
      filiais: user.filiaisPermitidas.map((fp) => ({
        idFilial: fp.idFilial,
        idEmpresa: fp.filial.idEmpresa,
        nome: fp.filial.nome,
      })),
    };
  }
}
