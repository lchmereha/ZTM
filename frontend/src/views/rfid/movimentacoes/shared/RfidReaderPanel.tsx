import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

// Icons
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FilterCenterFocusIcon from '@mui/icons-material/FilterCenterFocus';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SensorsIcon from '@mui/icons-material/Sensors';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { keyframes, useTheme } from '@mui/material/styles';

// Project
import { useErrorHandler } from 'hooks/useErrorHandler';
import { RfidTagManager } from 'services/rfid/RfidTagManager';
import { ConnectionStatus, RfidWebSocketService } from 'services/rfid/RfidWebSocketService';
import { type RfidTagWithCounter } from 'services/rfid/types';

// ── LocalStorage keys ───────────────────────────────────────
const LS_POWER = 'rfid_power';
const LS_TAG_FOCUS = 'rfid_tag_focus';
const LS_BUZZER = 'rfid_buzzer';
const LS_RSSI_ENABLED = 'rfid_rssi_enabled';
const LS_RSSI_MIN = 'rfid_rssi_min';
const LS_RSSI_MAX = 'rfid_rssi_max';
const LS_WS_ENDPOINT = 'rfid_ws_endpoint';
const LS_WS_PROTOCOL = 'rfid_ws_protocol';

const formatDoubleInput = (value: string): string => {
  let text = value.replace(/,/g, '.');
  text = text.replace(/[^\d.]/g, '');
  const parts = text.split('.');
  if (parts.length > 2) {
    text = parts[0] + '.' + parts.slice(1).join('');
  }
  return text;
};

const rotateOpen = keyframes`
  from { transform: rotate(180deg); }
  to   { transform: rotate(0deg); }
`;

const rotateClose = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(180deg); }
`;

// ── Imperative Handle ───────────────────────────────────────

export interface RfidReaderPanelHandle {
  tags: RfidTagWithCounter[];
  isReading: boolean;
  isConnected: boolean;
  clearTags: () => void;
}

// ── Props ───────────────────────────────────────────────────

export interface RfidReaderPanelProps {
  /** WebSocket host (e.g. "192.168.1.100") */
  host: string;
  /** WebSocket port (e.g. "8080") */
  port: string;
  /** WebSocket protocol ("ws" or "wss") */
  protocol?: string;
  /** WebSocket endpoint path (e.g. "RFID") */
  endpoint?: string;
  /** Whether to show advanced reader settings (power, tagFocus, buzzer, RSSI) */
  showAdvancedSettings?: boolean;
  /** Called whenever the tag list changes */
  onTagsChange?: (tags: RfidTagWithCounter[]) => void;
  /** Called when isReading state changes */
  onReadingChange?: (isReading: boolean) => void;
  /** Optional custom render for tag rows (for error highlighting etc) */
  renderTagRow?: (item: RfidTagWithCounter, index: number) => React.ReactNode;
  /** Override tags used for rendering (e.g. sorted with errors first). Internal tags are still tracked. */
  overrideTags?: RfidTagWithCounter[];
  /** Additional action buttons rendered after the built-in ones */
  extraActions?: React.ReactNode;
  /** Disable the discard button */
  disableDiscard?: boolean;
}

// ── Component ───────────────────────────────────────────────

const RfidReaderPanel = forwardRef<RfidReaderPanelHandle, RfidReaderPanelProps>(
  (
    {
      host,
      port,
      protocol = 'ws',
      endpoint = 'RFID',
      showAdvancedSettings = false,
      onTagsChange,
      onReadingChange,
      renderTagRow,
      overrideTags,
      extraActions,
      disableDiscard = false
    },
    ref
  ) => {
    const theme = useTheme();
    const handleError = useErrorHandler();

    // ── Connection State ──────────────────────────────────────
    const [connStatus, setConnStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);

    // ── Reader Settings (persisted in localStorage) ───────────
    const [power, setPower] = useState(Number(localStorage.getItem(LS_POWER)) || 30);
    const [tagFocus, setTagFocus] = useState(localStorage.getItem(LS_TAG_FOCUS) === 'true');
    const [buzzer, setBuzzer] = useState(localStorage.getItem(LS_BUZZER) !== 'false');
    const [rssiEnabled, setRssiEnabled] = useState(localStorage.getItem(LS_RSSI_ENABLED) === 'true');
    const [rssiMin, setRssiMin] = useState(localStorage.getItem(LS_RSSI_MIN) || '-90');
    const [rssiMax, setRssiMax] = useState(localStorage.getItem(LS_RSSI_MAX) || '-30');
    const [wsEndpoint, setWsEndpoint] = useState(localStorage.getItem(LS_WS_ENDPOINT) || endpoint);
    const [wsProtocol, setWsProtocol] = useState(localStorage.getItem(LS_WS_PROTOCOL) || protocol);

    // ── Reading State ─────────────────────────────────────────
    const [tags, setTags] = useState<RfidTagWithCounter[]>([]);
    const [isReading, setIsReading] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // ── Refs ──────────────────────────────────────────────────
    const wsServiceRef = useRef<RfidWebSocketService | null>(null);
    const tagManagerRef = useRef<RfidTagManager | null>(null);
    const hasToggledSettings = useRef(false);

    // Stable refs for parent callbacks (avoids re-triggering effects on every render)
    const onTagsChangeRef = useRef(onTagsChange);
    onTagsChangeRef.current = onTagsChange;
    const onReadingChangeRef = useRef(onReadingChange);
    onReadingChangeRef.current = onReadingChange;

    // ── Derived ──────────────────────────────────────────────
    const builtUrl = useMemo(() => `${wsProtocol}://${host}:${port}/${wsEndpoint}`, [wsProtocol, host, port, wsEndpoint]);
    const isConnected = connStatus === ConnectionStatus.CONNECTED;
    const isConnecting = connStatus === ConnectionStatus.CONNECTING;
    const canConnect = host.length > 0 && port.length > 0;

    const statusLabel = useMemo(() => {
      if (isConnected) return 'Conectado';
      if (isConnecting) return 'Conectando...';
      return 'Desconectado';
    }, [isConnected, isConnecting]);

    const statusColor = useMemo(() => {
      if (isConnected) return theme.palette.success.main;
      if (isConnecting) return theme.palette.warning.main;
      return theme.palette.error.main;
    }, [isConnected, isConnecting, theme]);

    // ── Effects ──────────────────────────────────────────────
    useEffect(() => {
      tagManagerRef.current = new RfidTagManager((newTags) => {
        setTags([...newTags]);
      });
      const handleBeforeUnload = () => {
        wsServiceRef.current?.disconnect();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        wsServiceRef.current?.disconnect();
      };
    }, []);

    // Persist reader settings
    useEffect(() => {
      localStorage.setItem(LS_POWER, power.toString());
      localStorage.setItem(LS_TAG_FOCUS, tagFocus.toString());
      localStorage.setItem(LS_BUZZER, buzzer.toString());
      localStorage.setItem(LS_RSSI_ENABLED, rssiEnabled.toString());
      localStorage.setItem(LS_RSSI_MIN, rssiMin);
      localStorage.setItem(LS_RSSI_MAX, rssiMax);
      localStorage.setItem(LS_WS_ENDPOINT, wsEndpoint);
      localStorage.setItem(LS_WS_PROTOCOL, wsProtocol);
    }, [power, tagFocus, buzzer, rssiEnabled, rssiMin, rssiMax, wsEndpoint, wsProtocol]);

    // Notify parent of tag changes
    useEffect(() => {
      onTagsChangeRef.current?.(tags);
    }, [tags]);

    // Notify parent of reading state changes
    useEffect(() => {
      onReadingChangeRef.current?.(isReading);
    }, [isReading]);

    // ── Handlers ─────────────────────────────────────────────

    const handleConnect = useCallback(() => {
      if (!wsServiceRef.current) {
        wsServiceRef.current = new RfidWebSocketService();
      }
      wsServiceRef.current.configureOnConnect({
        power,
        tagFocus,
        buzzer,
        rssiFilter: rssiEnabled ? { min: Number(rssiMin), max: Number(rssiMax) } : undefined
      });
      wsServiceRef.current.connect(builtUrl, {
        onStatusChange: setConnStatus,
        onTagRead: (tag) => tagManagerRef.current?.addTag(tag),
        onError: (err) => handleError(err)
      });
    }, [builtUrl, power, tagFocus, buzzer, rssiEnabled, rssiMin, rssiMax, handleError]);

    const handleDisconnect = useCallback(() => {
      wsServiceRef.current?.disconnect();
    }, []);

    const handleStartReading = useCallback(async () => {
      if (!isConnected) return;
      setSettingsOpen(false);
      try {
        await wsServiceRef.current?.startInventory({
          power,
          tagFocus,
          buzzer,
          rssiFilter: rssiEnabled ? { min: Number(rssiMin), max: Number(rssiMax) } : undefined
        });
        setIsReading(true);
      } catch (err) {
        handleError(err);
      }
    }, [isConnected, power, tagFocus, buzzer, rssiEnabled, rssiMin, rssiMax, handleError]);

    const handleStopReading = useCallback(async () => {
      try {
        await wsServiceRef.current?.stopInventory();
        setIsReading(false);
      } catch (err) {
        handleError(err);
      }
    }, [handleError]);

    const handleClearTags = useCallback(() => {
      tagManagerRef.current?.clear();
      setTags([]);
    }, []);

    // ── Imperative Handle ────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        tags,
        isReading,
        isConnected,
        clearTags: handleClearTags
      }),
      [tags, isReading, isConnected, handleClearTags]
    );

    // ── Render ───────────────────────────────────────────────
    return (
      <Box>
        {/* Connection Status Bar */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            py: 1.5
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SensorsIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Conexão
            </Typography>
            <Chip size="small" label={statusLabel} sx={{ bgcolor: statusColor, color: '#fff', fontWeight: 600 }} />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }} color="text.secondary">
              {wsProtocol}://{host}:{port}/{wsEndpoint}
            </Typography>
            {isConnected ? (
              <Button variant="outlined" color="error" startIcon={<LinkOffIcon />} onClick={handleDisconnect} disabled={isReading}>
                Desconectar
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={isConnecting ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                onClick={handleConnect}
                disabled={!canConnect}
              >
                {isConnecting ? 'Conectando...' : 'Conectar'}
              </Button>
            )}
            <Tooltip title={settingsOpen ? 'Fechar configurações' : 'Configurações de conexão'}>
              <IconButton
                color={settingsOpen ? 'primary' : 'inherit'}
                disabled={isReading}
                onClick={() => {
                  hasToggledSettings.current = true;
                  setSettingsOpen((prev) => !prev);
                }}
                size="small"
                sx={{
                  p: 0,
                  '& .MuiSvgIcon-root': {
                    animation: hasToggledSettings.current ? `${settingsOpen ? rotateClose : rotateOpen} 0.35s ease-in-out forwards` : 'none'
                  }
                }}
              >
                {settingsOpen ? <SettingsIcon /> : <SettingsOutlinedIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Connection Settings (collapsible) */}
        <Collapse in={settingsOpen} unmountOnExit>
          <Stack spacing={1} sx={{ px: 2, py: 1.5 }}>
            {/* Connection URL Settings */}
            <FormControlLabel
              control={
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
                  <Select
                    disabled={isConnected}
                    IconComponent={() => null}
                    onChange={(e) => setWsProtocol(e.target.value)}
                    size="small"
                    value={wsProtocol}
                    variant="filled"
                    sx={{
                      fontFamily: 'monospace',
                      minWidth: 'auto',
                      '& .MuiSelect-select': { py: 0.3, px: 0.5, pt: 1, pr: `${theme.spacing(0.5)} !important` }
                    }}
                  >
                    <MenuItem value="ws">ws</MenuItem>
                    <MenuItem value="wss">wss</MenuItem>
                  </Select>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }} color="text.secondary">
                    ://{host}:{port}/
                  </Typography>
                  <TextField
                    disabled={isConnected}
                    onChange={(e) => setWsEndpoint(e.target.value)}
                    size="small"
                    value={wsEndpoint}
                    variant="filled"
                    slotProps={{
                      htmlInput: {
                        sx: {
                          fontFamily: 'monospace',
                          py: 0.3,
                          px: 0.5,
                          pt: 1,
                          width: `${Math.max(wsEndpoint.length, 3)}ch`
                        }
                      }
                    }}
                  />
                </Stack>
              }
              label={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <LinkIcon />
                  <Typography>URI WebSocket</Typography>
                </Stack>
              }
              labelPlacement="start"
              sx={{ gap: 1, justifyContent: 'space-between', m: 0 }}
            />

            <FormControlLabel
              control={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Checkbox checked={rssiEnabled} onChange={(e) => setRssiEnabled(e.target.checked)} sx={{ py: 0 }} />

                  <TextField
                    disabled={!rssiEnabled}
                    onChange={(e) => setRssiMin(formatDoubleInput(e.target.value))}
                    placeholder="Min"
                    size="small"
                    value={rssiMin}
                    slotProps={{ htmlInput: { sx: { fontFamily: 'monospace', px: 2 } } }}
                    sx={{ width: `calc(3ch + 2 * ${theme.spacing(2)})` }}
                  />

                  <Typography>—</Typography>

                  <TextField
                    disabled={!rssiEnabled}
                    onChange={(e) => setRssiMax(formatDoubleInput(e.target.value))}
                    placeholder="Max"
                    size="small"
                    value={rssiMax}
                    slotProps={{ htmlInput: { sx: { fontFamily: 'monospace', px: 2 } } }}
                    sx={{ width: `calc(3ch + 2 * ${theme.spacing(2)})` }}
                  />
                </Stack>
              }
              label={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CompressIcon sx={{ rotate: '90deg' }} />
                  <Typography>Intervalo RSSI</Typography>
                </Stack>
              }
              labelPlacement="start"
              sx={{ gap: 1, justifyContent: 'space-between', m: 0 }}
            />

            {/* Advanced Settings */}
            {showAdvancedSettings && (
              <>
                <FormControlLabel
                  control={
                    <Select
                      autoWidth
                      disabled={!isConnected}
                      MenuProps={{ sx: { maxHeight: '50vh' } }}
                      onChange={(e) => setPower(Number(e.target.value))}
                      size="small"
                      value={power}
                    >
                      {Array.from({ length: 26 }, (_, i) => i + 5).map((p) => (
                        <MenuItem key={p} value={p}>
                          +{p} dBm
                        </MenuItem>
                      ))}
                    </Select>
                  }
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <NetworkCheckIcon />
                      <Typography>Potência de leitura</Typography>
                    </Stack>
                  }
                  labelPlacement="start"
                  sx={{ gap: 1, justifyContent: 'space-between', m: 0 }}
                />

                <Tooltip title="Essa opção faz com que o leitor ignore fisicamente as etiquetas já lidas durante a sessão atual. Ideal para varreduras em ambientes poluídos, garantindo que a Qtde se mantenha sempre em 1.">
                  <FormControlLabel
                    control={<Switch disabled={!isConnected} checked={tagFocus} onChange={(e) => setTagFocus(e.target.checked)} />}
                    label={
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <FilterCenterFocusIcon />
                        <Typography>Tag Focus</Typography>
                        <HelpOutlinedIcon fontSize="small" color="action" />
                      </Stack>
                    }
                    labelPlacement="start"
                    sx={{ gap: 1, justifyContent: 'space-between', m: 0 }}
                  />
                </Tooltip>

                <FormControlLabel
                  control={<Switch disabled={!isConnected} checked={buzzer} onChange={(e) => setBuzzer(e.target.checked)} />}
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <VolumeUpIcon />
                      <Typography>Efeitos Sonoros</Typography>
                    </Stack>
                  }
                  labelPlacement="start"
                  sx={{ gap: 1, justifyContent: 'space-between', m: 0 }}
                />
              </>
            )}
          </Stack>
        </Collapse>

        {/* Tag List */}
        <Stack
          sx={{ px: 2, bgcolor: 'md3.surfaceContainerHigh', borderRadius: 2, border: '1px solid', borderColor: 'divider', minHeight: 300 }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
              Etiquetas
            </Typography>

            {isReading ? (
              <Tooltip title="Parar Leitura">
                <IconButton color="error" onClick={handleStopReading} sx={{ bgcolor: theme.palette.error.light + '22' }}>
                  <StopIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <Tooltip title="Iniciar Leitura">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={handleStartReading}
                      disabled={!isConnected}
                      sx={{ bgcolor: theme.palette.primary.light + '22' }}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                {tags.length > 0 && !disableDiscard && (
                  <Tooltip title="Descartar">
                    <IconButton color="warning" onClick={handleClearTags}>
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {extraActions}
              </>
            )}
          </Stack>

          {/* Header */}
          <Stack direction="row" sx={{ px: 1, py: 0.5, borderBottom: '2px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 700, flex: 1 }}>
              EPC
            </Typography>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 700, width: 70, textAlign: 'right' }}>
              RSSI
            </Typography>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 700, width: 50, textAlign: 'right' }}>
              Qtde
            </Typography>
          </Stack>

          {/* Tag Rows */}
          <Stack sx={{ flex: 1, overflowY: 'auto' }}>
            {(overrideTags ?? tags).length === 0 ? (
              <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Nenhuma etiqueta lida
                </Typography>
              </Stack>
            ) : (
              (overrideTags ?? tags).map((item, idx) =>
                renderTagRow ? (
                  renderTagRow(item, idx)
                ) : (
                  <Stack
                    key={item.tag.codigoRfid}
                    direction="row"
                    sx={{
                      px: 1,
                      py: 0.5,
                      bgcolor: idx % 2 === 0 ? 'transparent' : theme.palette.action.hover,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: theme.palette.action.selected }
                    }}
                    onClick={() => navigator.clipboard.writeText(item.tag.codigoRfid)}
                  >
                    <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', flex: 1 }}>
                      {item.tag.codigoRfid}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', width: 70, textAlign: 'right', fontSize: 12 }}>
                      {item.tag.rssi}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
                      {item.count}
                    </Typography>
                  </Stack>
                )
              )
            )}
          </Stack>

          {/* Footer */}
          <Stack direction="row" sx={{ px: 1, py: 1, borderTop: '2px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 700, flex: 1 }}>
              TOTAL
            </Typography>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {tags.length}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    );
  }
);

export default RfidReaderPanel;
