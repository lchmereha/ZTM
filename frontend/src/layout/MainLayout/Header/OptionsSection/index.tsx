import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import { useColorScheme, useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// project imports
import { useAuth } from 'contexts/AuthContext';
import useConfig from 'hooks/useConfig';
import { useDialog } from 'hooks/useDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Usuario } from 'models';
import { usuarioEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import axios from 'utils/axios';

// assets
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconKey, IconLogout, IconMoon, IconSun, IconUserEdit } from '@tabler/icons-react';
import { tenant } from 'config/tenants';

// ==============================|| FORMULÁRIO ALTERAR DADOS ||============================== //

export interface FormRef {
  save: () => Promise<void>;
}

const EditProfileContent = forwardRef<FormRef, { user: Usuario; onSuccess: () => void }>(({ user, onSuccess }, ref) => {
  const [nome, setNome] = useState(user.nome || '');
  const [usuario, setUsuario] = useState(user.usuario || '');
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();
  const { closeDialog } = useDialog();

  const handleSave = async () => {
    if (!usuario.trim()) {
      setError('O nome de usuário é obrigatório');
      return;
    }
    setError('');
    try {
      await axios.patch(`${usuarioEndpoint}/${user.id}`, { nome: nome.trim() || null, usuario: usuario.trim() });
      // Atualizar localStorage
      const stored = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      stored.nome = nome.trim() || null;
      stored.usuario = usuario.trim();
      if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(stored));
      else sessionStorage.setItem('user', JSON.stringify(stored));

      showSnackbar({ message: 'Dados atualizados com sucesso!', severity: 'success' });
      closeDialog();
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Erro ao atualizar dados');
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

  return (
    <Stack spacing={2}>
      <TextField label="Nome de exibição" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth size="small" />
      <TextField
        label="Nome de usuário (login)"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        fullWidth
        size="small"
        required
        error={!!error && !usuario.trim()}
      />
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
    </Stack>
  );
});

// ==============================|| FORMULÁRIO ALTERAR SENHA ||============================== //

const ChangePasswordContent = forwardRef<FormRef, { userId: number; onSuccess: () => void }>(({ userId, onSuccess }, ref) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();
  const { closeDialog } = useDialog();

  const handleSave = async () => {
    if (!senhaAtual.trim()) {
      setError('A senha atual é obrigatória');
      return;
    }
    if (!novaSenha.trim()) {
      setError('A nova senha é obrigatória');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    setError('');
    try {
      await axios.patch(`${usuarioEndpoint}/${userId}`, {
        senhaAtual: senhaAtual,
        senha: novaSenha
      });
      showSnackbar({ message: 'Senha alterada com sucesso!', severity: 'success' });
      closeDialog();
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

  return (
    <Stack spacing={2}>
      <TextField
        label="Senha atual"
        type="password"
        value={senhaAtual}
        onChange={(e) => setSenhaAtual(e.target.value)}
        fullWidth
        size="small"
        required
      />
      <TextField
        label="Nova senha"
        type="password"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        fullWidth
        size="small"
        required
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        fullWidth
        size="small"
        required
        error={!!confirmarSenha && novaSenha !== confirmarSenha}
        helperText={confirmarSenha && novaSenha !== confirmarSenha ? 'As senhas não coincidem' : ''}
      />
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
    </Stack>
  );
});

// ==============================|| MENU DE OPÇÕES ||============================== //

export default function OptionsSection() {
  const theme = useTheme();
  const { logout } = useAuth();
  const { showDialog, closeDialog } = useDialog();
  const {
    state: { borderRadius }
  } = useConfig();

  const { mode, setMode } = useColorScheme();

  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  // Dados do usuário logado
  const user: Usuario = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const userName = user?.nome || user?.usuario || 'Usuário';
  const userRole = user?.regra === 'ADMIN' ? 'Administrador' : 'Operador';

  /**
   * anchorEl stores the DOM element for the Popper.
   * Using state instead of ref.current avoids accessing refs during render.
   */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const anchorCallbackRef = (node: HTMLElement | null) => {
    if (node) setAnchorEl(node);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorEl && anchorEl.contains(event.target as Node)) {
      return;
    }

    setOpen(false);
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorEl?.focus();
    }

    prevOpen.current = open;
  }, [open, anchorEl]);

  const editProfileRef = useRef<FormRef>(null);
  const changePasswordRef = useRef<FormRef>(null);

  const handleEditProfile = () => {
    setOpen(false);
    showDialog({
      title: 'Alterar Dados',
      content: <EditProfileContent ref={editProfileRef} user={user} onSuccess={() => forceUpdate((n) => n + 1)} />,
      actions: [
        <Button key="cancel" onClick={closeDialog} color="inherit">
          Cancelar
        </Button>,
        <Button key="save" onClick={() => editProfileRef.current?.save()} variant="contained">
          Salvar
        </Button>
      ]
    });
  };

  const handleChangePassword = () => {
    setOpen(false);
    const noop = () => undefined;
    showDialog({
      title: 'Alterar Senha',
      content: <ChangePasswordContent ref={changePasswordRef} userId={user.id} onSuccess={noop} />,
      actions: [
        <Button key="cancel" onClick={closeDialog} color="inherit">
          Cancelar
        </Button>,
        <Button key="save" onClick={() => changePasswordRef.current?.save()} variant="contained">
          Alterar Senha
        </Button>
      ]
    });
  };

  const handleLogout = () => {
    showDialog({
      dividers: false,
      title: 'Sair do Sistema',
      content: 'Deseja realmente sair do sistema?',
      actions: [
        <Button key="cancel" onClick={closeDialog} color="inherit">
          Cancelar
        </Button>,
        <Button
          key="confirm"
          onClick={async () => {
            closeDialog();
            setOpen(false);
            await logout();
            window.location.href = (import.meta.env.VITE_APP_BASE_NAME || '') + '/login';
          }}
          color="primary"
          variant="contained"
        >
          Sair
        </Button>
      ]
    });
  };

  const handleThemeChange = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <IconButton
        ref={anchorCallbackRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        aria-label="user-account"
        sx={{
          ...theme.typography.commonAvatar,
          ...theme.typography.mediumAvatar,
          transition: 'all .2s ease-in-out'
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Popper
        placement="bottom"
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        transition
        disablePortal
        modifiers={[{ name: 'offset', options: { offset: [0, 14] } }]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions in={open} {...TransitionProps}>
              <Paper>
                {open && (
                  <MainCard
                    border={false}
                    elevation={16}
                    content={false}
                    boxShadow
                    shadow={theme.shadows[16]}
                    sx={{ bgcolor: 'md3.surfaceContainerHigh' }}
                  >
                    <Box sx={{ p: 2, pb: 0 }}>
                      <Stack>
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="h4">{userName}</Typography>
                        </Stack>
                        <Typography variant="subtitle2">{userRole}</Typography>
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        py: 0,
                        height: '100%',
                        maxHeight: 'calc(100vh - 250px)',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': { width: 5 }
                      }}
                    >
                      <List
                        component="nav"
                        sx={{
                          width: '100%',
                          maxWidth: 350,
                          minWidth: 300,
                          borderRadius: `${borderRadius}px`,
                          '& .MuiListItemButton-root': { mt: 0.5 }
                        }}
                      >
                        <ListItemButton sx={{ borderRadius: `${borderRadius}px` }} onClick={handleEditProfile}>
                          <ListItemIcon>
                            <IconUserEdit stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText>Alterar Dados</ListItemText>
                        </ListItemButton>
                        <ListItemButton sx={{ borderRadius: `${borderRadius}px` }} onClick={handleChangePassword}>
                          <ListItemIcon>
                            <IconKey stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText>Alterar Senha</ListItemText>
                        </ListItemButton>
                        {tenant.allowThemeToggle && (
                          <ListItemButton sx={{ borderRadius: `${borderRadius}px` }} onClick={handleThemeChange}>
                            <ListItemIcon>
                              {mode === 'dark' ? <IconSun stroke={1.5} size="20px" /> : <IconMoon stroke={1.5} size="20px" />}
                            </ListItemIcon>
                            <ListItemText>Modo {mode === 'dark' ? 'Claro' : 'Escuro'}</ListItemText>
                          </ListItemButton>
                        )}
                        <ListItemButton sx={{ borderRadius: `${borderRadius}px` }} onClick={handleLogout}>
                          <ListItemIcon>
                            <IconLogout stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText>Sair</ListItemText>
                        </ListItemButton>
                      </List>
                    </Box>
                  </MainCard>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
