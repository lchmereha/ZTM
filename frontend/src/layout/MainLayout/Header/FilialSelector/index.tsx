//packages
import { useCallback, useMemo, useRef, useState } from 'react';

// icons
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// project imports
import { type AuthEmpresa, type AuthFilial, useAuth } from 'contexts/AuthContext';
import axiosServices from 'utils/axios';

interface FilialResponse {
  empresas: AuthEmpresa[];
  filiais: AuthFilial[];
}

const FilialSelector = () => {
  const theme = useTheme();
  const { activeFilial, changeActiveFilial } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [subAnchorEl, setSubAnchorEl] = useState<null | HTMLElement>(null);
  const [activeEmpresa, setActiveEmpresa] = useState<AuthEmpresa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado local alimentado pela requisição (não mais derivado do user)
  const [empresas, setEmpresas] = useState<AuthEmpresa[]>([]);
  const [filiais, setFiliais] = useState<AuthFilial[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Ref para evitar race conditions entre aberturas rápidas
  const fetchIdRef = useRef(0);

  // Agrupar filiais por empresa
  const filiaisByEmpresa = useMemo(() => {
    const map = new Map<number, AuthFilial[]>();
    filiais.forEach((f) => {
      const arr = map.get(f.idEmpresa) || [];
      arr.push(f);
      map.set(f.idEmpresa, arr);
    });
    return map;
  }, [filiais]);

  // Filtro de busca aplicado em empresas e filiais
  const filteredEmpresas = useMemo(() => {
    if (!searchTerm) return empresas;
    const term = searchTerm.toLowerCase();
    return empresas.filter((emp) => {
      if (emp.nome.toLowerCase().includes(term)) return true;
      const empFiliais = filiaisByEmpresa.get(emp.id) || [];
      return empFiliais.some((f) => f.nome.toLowerCase().includes(term));
    });
  }, [empresas, searchTerm, filiaisByEmpresa]);

  // Filiais filtradas do submenu ativo
  const activeSubFiliais = useMemo(() => {
    if (!activeEmpresa) return [];
    const empFiliais = filiaisByEmpresa.get(activeEmpresa.id) || [];
    if (!searchTerm) return empFiliais;
    const term = searchTerm.toLowerCase();
    return empFiliais.filter((f) => f.nome.toLowerCase().includes(term));
  }, [activeEmpresa, filiaisByEmpresa, searchTerm]);

  // Buscar filiais atualizadas da API
  const fetchFiliais = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);

    try {
      const { data } = await axiosServices.get<FilialResponse>('/auth/me/filiais');

      // Descarta se outra requisição foi disparada enquanto essa estava em andamento
      if (currentFetchId !== fetchIdRef.current) return;

      setEmpresas(data.empresas);
      setFiliais(data.filiais);
      setHasLoaded(true);

      // Auto-selecionar a primeira filial caso nenhuma esteja selecionada
      if (!activeFilial && data.filiais.length > 0) {
        changeActiveFilial(data.filiais[0]);
      }
    } catch {
      // Silencioso — mantém o estado anterior caso a requisição falhe
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [activeFilial, changeActiveFilial]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Sempre busca dados atualizados ao abrir
    fetchFiliais();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSubAnchorEl(null);
    setActiveEmpresa(null);
    setSearchTerm('');
  };

  const handleEmpresaEnter = (event: React.MouseEvent<HTMLElement>, empresa: AuthEmpresa) => {
    setSubAnchorEl(event.currentTarget);
    setActiveEmpresa(empresa);
  };

  const handleEmpresaLeaveNoSub = () => {
    // Quando sai de um item sem submenu (1 filial), limpa o submenu
    setSubAnchorEl(null);
    setActiveEmpresa(null);
  };

  const handleSelect = (filial: AuthFilial) => {
    changeActiveFilial(filial);
    handleClose();
  };

  const paperSx = {
    bgcolor: theme.vars?.palette.md3.surfaceContainerHigh,
    borderRadius: 2,
    boxShadow: theme.vars?.customShadows.z1,
    color: theme.vars?.palette.text.primary,
    p: 1
  };

  return (
    <>
      <ButtonBase
        onClick={handleClick}
        disableRipple
        sx={{
          px: 2,
          py: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: theme.vars?.palette.md3.surfaceContainerHighest
          }
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: theme.vars?.palette.text.primary,
            letterSpacing: '-0.5px'
          }}
        >
          {activeFilial?.nome || 'Selecione uma filial'}
        </Typography>
        <KeyboardArrowDownIcon
          fontSize="medium"
          sx={{
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out'
          }}
        />
      </ButtonBase>

      {/* Menu principal: lista de empresas */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { ...paperSx, mt: 1.5, width: 300 } } }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: theme.vars?.palette.text.primary }}>
                  <SearchIcon />
                </InputAdornment>
              )
            }
          }}
          sx={{ input: { color: theme.vars?.palette.text.primary } }}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: theme.vars?.palette.text.secondary }}>
                Carregando...
              </Typography>
            </Stack>
          ) : hasLoaded && filiais.length === 0 ? (
            <Stack spacing={1} sx={{ alignItems: 'center', py: 3 }}>
              <WarningAmberIcon sx={{ color: theme.vars?.palette.warning.main, fontSize: 32 }} />
              <Typography variant="body2" sx={{ color: theme.vars?.palette.text.secondary, textAlign: 'center', px: 2 }}>
                Nenhuma filial vinculada ao seu usuário
              </Typography>
            </Stack>
          ) : filteredEmpresas.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.vars?.palette.text.secondary, p: 2, textAlign: 'center' }}>
              Nenhuma empresa encontrada
            </Typography>
          ) : (
            filteredEmpresas.map((emp) => {
              const empFiliais = filiaisByEmpresa.get(emp.id) || [];
              // Se empresa tem apenas 1 filial, seleciona direto
              if (empFiliais.length === 1) {
                return (
                  <MenuItem
                    key={emp.id}
                    onClick={() => handleSelect(empFiliais[0])}
                    onMouseEnter={handleEmpresaLeaveNoSub}
                    selected={empFiliais[0].idFilial === activeFilial?.idFilial}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText primary={emp.nome} secondary={empFiliais[0].nome} />
                  </MenuItem>
                );
              }
              return (
                <MenuItem
                  key={emp.id}
                  onMouseEnter={(e) => handleEmpresaEnter(e, emp)}
                  selected={activeEmpresa?.id === emp.id}
                  sx={{ borderRadius: 1, mb: 0.5, justifyContent: 'space-between' }}
                >
                  <ListItemText primary={emp.nome} secondary={`${empFiliais.length} filiais`} />
                  <ChevronRightIcon fontSize="small" sx={{ ml: 1, color: theme.vars?.palette.text.secondary }} />
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>

      {/* Submenu: filiais da empresa (Popper sem backdrop para permitir hover fluido) */}
      <Popper
        open={Boolean(subAnchorEl) && Boolean(activeEmpresa)}
        anchorEl={subAnchorEl}
        placement="right-start"
        sx={{ zIndex: theme.zIndex.modal + 1 }}
        disablePortal={false}
      >
        <ClickAwayListener
          onClickAway={() => {
            setSubAnchorEl(null);
            setActiveEmpresa(null);
          }}
        >
          <Paper sx={{ ...paperSx, bgcolor: theme.vars?.palette.md3.surfaceContainerHighest, width: 260, ml: 0.5 }}>
            <MenuList dense disablePadding>
              {activeSubFiliais.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.vars?.palette.text.secondary, p: 2, textAlign: 'center' }}>
                  Nenhuma filial encontrada
                </Typography>
              ) : (
                activeSubFiliais.map((f) => (
                  <MenuItem
                    key={f.idFilial}
                    onClick={() => handleSelect(f)}
                    selected={f.idFilial === activeFilial?.idFilial}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    {f.nome}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default FilialSelector;
