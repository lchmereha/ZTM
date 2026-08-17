import { useTheme } from '@mui/material/styles';
import logoDark from 'assets/images/logo-dark.png';
import logo from 'assets/images/logo.png';
import { tenant } from 'config/tenants';
import { useAuth } from 'contexts/AuthContext';

const fittedStyle: React.CSSProperties = {
  height: '100%',
  width: 'auto',
  maxWidth: '100%',
  objectFit: 'contain',
  objectPosition: 'left center',
  display: 'block'
};

export default function Logo() {
  const theme = useTheme();
  const { branding } = useAuth();

  // Variantes white-label têm marca fixa e ignoram o branding por empresa.
  if (tenant.logo) {
    return <img src={tenant.logo} alt={tenant.logoAlt} style={fittedStyle} />;
  }

  if (tenant.useDatabaseBranding && branding?.logo) {
    return <img src={branding.logo} alt={tenant.logoAlt} style={fittedStyle} />;
  }

  return <img src={theme.palette.mode === 'dark' ? logoDark : logo} alt={tenant.logoAlt} width="100%" style={{ display: 'block' }} />;
}
