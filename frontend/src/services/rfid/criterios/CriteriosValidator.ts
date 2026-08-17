/**
 * CriteriosValidator — DORMANT
 *
 * Tradução direta do criterios_validator.dart. Nenhuma view importa este
 * arquivo no momento. Pronto para ativação quando a API de critérios for integrada.
 */

import {
  type CampoCriterio,
  ClassificacaoCriterio,
  ComparacaoCriterio,
  type Criterio,
  type TagBlock,
  TipoCharCriterio,
  type ValidatedTag
} from './types';

export class CriteriosValidator {
  private criterios: Criterio[];

  constructor(criterios: Criterio[]) {
    this.criterios = criterios;
  }

  private extract(epc: string, campo?: CampoCriterio): string {
    if (!campo || campo.posicaoInicial == null || campo.qtdeCaracteres == null) return '';
    if (epc.length < campo.posicaoInicial + campo.qtdeCaracteres) return '';
    return epc.substring(campo.posicaoInicial, campo.posicaoInicial + campo.qtdeCaracteres);
  }

  private applyTipoChar(value: string, tipo?: TipoCharCriterio): string {
    if (!value) return value;
    if (tipo === TipoCharCriterio.hexadecimal) {
      try {
        return BigInt('0x' + value).toString();
      } catch {
        return value;
      }
    }
    return value;
  }

  private compare(actual: string, expected: string, comparacao?: ComparacaoCriterio): boolean {
    if (!comparacao) return false;
    switch (comparacao) {
      case ComparacaoCriterio.igual:
        return actual === expected;
      case ComparacaoCriterio.diferente:
        return actual !== expected;
      case ComparacaoCriterio.maior:
        return actual > expected;
      case ComparacaoCriterio.menor:
        return actual < expected;
      case ComparacaoCriterio.contem:
        return actual.includes(expected);
      case ComparacaoCriterio.contador:
        return true;
    }
  }

  private matchesCriterio(epc: string, criterio: Criterio, parentEpc?: string): boolean {
    if (criterio.itemValidacaoPrincipal) {
      if (!this.matchesCriterio(epc, criterio.itemValidacaoPrincipal)) return false;
    }

    const actual = this.extract(epc, criterio.campo);

    if (criterio.comparacao === ComparacaoCriterio.contador) return true;

    let expected = '';
    if (criterio.valorComparativo != null) {
      expected = criterio.valorComparativo;
    } else if (criterio.campoComparativo && parentEpc) {
      expected = this.extract(parentEpc, criterio.campoComparativo);
    } else if (criterio.campoComparativo && !parentEpc) {
      return false;
    }

    return this.compare(actual, expected, criterio.comparacao);
  }

  private getExpectedCount(processedPrincipalEpc: string, vRule: Criterio): number | null {
    if (vRule.comparacao === ComparacaoCriterio.contador) {
      const expectedStr = vRule.valorComparativo ?? this.extract(processedPrincipalEpc, vRule.campo);
      const n = parseInt(expectedStr, 10);
      return isNaN(n) ? null : n;
    }
    return null;
  }

  validate(epcs: string[], epcToRssi?: Map<string, string>): { blocks: TagBlock[]; orphans: ValidatedTag[] } {
    const principals: TagBlock[] = [];
    const details: ValidatedTag[] = [];
    const orphans: ValidatedTag[] = [];

    const principalRules = this.criterios.filter((c) => c.classificacao === ClassificacaoCriterio.principal);
    const detailRules = this.criterios.filter((c) => c.classificacao === ClassificacaoCriterio.detalhe);
    const validationRules = this.criterios.filter((c) => c.classificacao === ClassificacaoCriterio.validacao);

    const isHex = this.criterios.some((c) => c.tipoCaracterRFID === TipoCharCriterio.hexadecimal);

    const processedMap = new Map<string, string>();
    for (const epc of epcs) {
      processedMap.set(epc, isHex ? this.applyTipoChar(epc, TipoCharCriterio.hexadecimal) : epc);
    }

    for (const epc of epcs) {
      const processed = processedMap.get(epc)!;
      const rssi = epcToRssi?.get(epc);
      let isPrincipal = false;
      let isDetail = false;

      if (principalRules.length > 0 && principalRules.every((r) => this.matchesCriterio(processed, r))) {
        principals.push({
          principal: { epc, rssi, matchedCriterios: principalRules, errors: [], convertedValue: isHex ? processed : undefined },
          filhas: [],
          errors: []
        });
        isPrincipal = true;
      }

      if (detailRules.length > 0 && detailRules.every((r) => this.matchesCriterio(processed, r))) {
        details.push({ epc, rssi, matchedCriterios: detailRules, errors: [], convertedValue: isHex ? processed : undefined });
        isDetail = true;
      }

      if (!isPrincipal && !isDetail) {
        orphans.push({
          epc,
          rssi,
          matchedCriterios: [],
          convertedValue: isHex ? processed : undefined,
          errors: ['Etiqueta não reconhecida.']
        });
      }
    }

    // Pre-calculate block capacity
    for (const block of principals) {
      const pProcessed = processedMap.get(block.principal.epc)!;
      for (const vRule of validationRules) {
        if (
          vRule.comparacao === ComparacaoCriterio.contador &&
          vRule.itemValidacaoPrincipal?.classificacao === ClassificacaoCriterio.principal
        ) {
          if (this.matchesCriterio(pProcessed, vRule.itemValidacaoPrincipal!)) {
            block.expectedChildrenCount = this.getExpectedCount(pProcessed, vRule) ?? undefined;
            break;
          }
        }
      }
    }

    // Link details to principals
    for (const detail of details) {
      let linked = false;
      for (const block of principals) {
        const linkingRules = validationRules.filter(
          (v) => v.campoComparativo && v.itemValidacaoPrincipal?.classificacao === ClassificacaoCriterio.detalhe
        );
        if (linkingRules.length === 0) continue;

        const dProcessed = processedMap.get(detail.epc)!;
        const pProcessed = processedMap.get(block.principal.epc)!;

        const matches = linkingRules.every((v) => this.matchesCriterio(dProcessed, v, pProcessed));
        if (!matches) continue;

        const hasAccumulate = linkingRules.some((v) => v.acumula);
        if (hasAccumulate && block.expectedChildrenCount != null && block.filhas.length >= block.expectedChildrenCount) continue;

        block.filhas.push(detail);
        linked = true;
        break;
      }

      if (!linked) {
        orphans.push({ ...detail, errors: ['Etiqueta filha sem volume pai correspondente.'] });
      }
    }

    // Counter validations
    for (const block of principals) {
      const pProcessed = processedMap.get(block.principal.epc)!;
      for (const vRule of validationRules) {
        if (vRule.comparacao === ComparacaoCriterio.contador && vRule.campoComparativo) {
          const expected = this.getExpectedCount(pProcessed, vRule);
          if (expected != null && block.filhas.length !== expected) {
            block.errors.push(`Quantidade incorreta. Esperado: ${expected}, Lido: ${block.filhas.length}`);
          }
        }
      }
    }

    return { blocks: principals, orphans };
  }
}
