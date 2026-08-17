abstract class Endpoints {
  const Endpoints._();

  static const auth = '/auth';
  static const login = '$auth/login';
  static const filiais = '$auth/me/filiais';

  static const movimentacao = '/movimentacao';
  static const movimentacaoPendentes = '$movimentacao/pendentes';

  static String oneMovimentacao(int id) => '$movimentacao/$id';
  static String processar(int id) => '$movimentacao/$id/processar';
  static String imprimir(int id) => '$movimentacao/$id/imprimir';
  static String finalizar(int id) => '$movimentacao/$id/finalizar';
  static String importacaoItems(int id) => '$movimentacao/$id/importacao-items';
  static String processedTags(int id) => '$movimentacao/$id/tags-processadas';

  static String associacaoProdutos(int id) =>
      '$movimentacao/$id/associacao/produtos';
  static String concluirAssociacao(int id) =>
      '$movimentacao/$id/associacao/concluir';
  static String validarAssociacao(int id) =>
      '$movimentacao/$id/associacao/validar';

  static String conferenciaProdutos(int id) =>
      '$movimentacao/$id/conferencia/produtos';
  static String concluirConferencia(int id) =>
      '$movimentacao/$id/conferencia/concluir';

  static String transferenciaProdutos(int id) =>
      '$movimentacao/$id/transferencia/produtos';
  static String concluirTransferencia(int id) =>
      '$movimentacao/$id/transferencia/concluir';

  static String validarLeitura(int id) => '$movimentacao/$id/leitura/validar';
  static String baixaLeitura(int id) => '$movimentacao/$id/leitura/baixa';
  static String relatorioLeitura(int id) =>
      '$movimentacao/$id/leitura/relatorio';

  // ── Batch / Lotes ──────────────────────────────────────────────────────────

  static String lotesAssociacao(int id) => '$movimentacao/$id/associacao/lotes';
  static String concluirLotesAssociacao(int id) =>
      '$movimentacao/$id/associacao/concluir-lotes';

  static String lotesConferencia(int id) =>
      '$movimentacao/$id/conferencia/lotes';
  static String concluirLotesConferencia(int id) =>
      '$movimentacao/$id/conferencia/concluir-lotes';

  static String lotesTransferencia(int id) =>
      '$movimentacao/$id/transferencia/lotes';
  static String concluirLotesTransferencia(int id) =>
      '$movimentacao/$id/transferencia/concluir-lotes';

  static String lotesLeitura(int id) => '$movimentacao/$id/leitura/lotes';
  static String concluirLotesLeitura(int id) =>
      '$movimentacao/$id/leitura/concluir-lotes';

  static String cancelarLotes(int id) => '$movimentacao/$id/lotes';
}
