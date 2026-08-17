import { useState } from 'react';

// Icons
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

// Local
import EditItemDialog from './EditItemDialog';
import TabItensImportados from './TabItensImportados';
import TabProdutos from './TabProdutos';
import TabTagsRfid from './TabTagsRfid';
import { useMovimentacaoDados } from './useMovimentacaoDados';

// ── Props ───────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  movimentacaoId: number;
  situacao: string;
  tipoOpcao?: string;
}

// ── Component ───────────────────────────────────────────────

const MovimentacaoDadosDialog = ({ open, onClose, movimentacaoId, situacao, tipoOpcao }: Props) => {
  const isAssociacao = tipoOpcao === 'ASSOCIACAO';
  const isConferencia = tipoOpcao === 'CONFERENCIA';
  const isAssociacaoLike = isAssociacao || isConferencia;
  const isProcessed = ['PROCESSADO', 'FINALIZADO'].includes(situacao);
  const isReadOnly = isProcessed || situacao === 'FINALIZADO';
  const canAddItems = isAssociacaoLike && situacao === 'IMPORTADO';
  const tagsEnabled = isProcessed && !isAssociacaoLike;
  const importItemsEnabled = !isProcessed || isAssociacaoLike;

  const [activeTab, setActiveTab] = useState(isProcessed && !isAssociacaoLike ? 1 : 0);

  const {
    importItems,
    produtos,
    tags,
    tagCountByCode,
    loading,
    editDialog,
    closeEditDialog,
    handleSaveEdit,
    handleDeleteImportItem,
    openEditImportItem,
    openCreateAssociacaoItem,
    openEditProduto,
    openEditTag
  } = useMovimentacaoDados({
    movimentacaoId,
    isAssociacao,
    isConferencia,
    tagsEnabled,
    dialogOpen: open
  });

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          onClose();
        }}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {'Dados da Movimentação'}
            {canAddItems && (
              <Button variant="outlined" size="small" startIcon={<AddOutlinedIcon />} onClick={openCreateAssociacaoItem}>
                Adicionar Item
              </Button>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {isAssociacaoLike ? (
            /* ── Associação/Conferência: single view, no tabs ─────────── */
            <Box sx={{ p: 2 }}>
              <TabItensImportados
                rows={importItems}
                loading={loading}
                mode={isConferencia ? 'conferencia' : 'associacao'}
                readOnly={isReadOnly}
                tagCountByCode={isConferencia ? tagCountByCode : undefined}
                onEdit={openEditImportItem}
                onDelete={handleDeleteImportItem}
              />
            </Box>
          ) : (
            /* ── Default: tabbed view ─────────────────────── */
            <>
              <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab label="Itens Importados" disabled={!importItemsEnabled} />
                <Tab label="Produtos" />
                <Tab label="Tags RFID" disabled={!tagsEnabled} />
              </Tabs>

              <Box sx={{ p: 2 }}>
                {activeTab === 0 && (
                  <TabItensImportados rows={importItems} loading={loading} onEdit={openEditImportItem} onDelete={handleDeleteImportItem} />
                )}
                {activeTab === 1 && <TabProdutos rows={produtos} loading={loading} onEdit={openEditProduto} />}
                {activeTab === 2 && tagsEnabled && <TabTagsRfid rows={tags} loading={loading} onEdit={openEditTag} />}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <EditItemDialog editDialog={editDialog} onClose={closeEditDialog} onSave={handleSaveEdit} />
    </>
  );
};

export default MovimentacaoDadosDialog;
