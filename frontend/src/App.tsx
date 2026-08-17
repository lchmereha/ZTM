import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes';

// project imports
import NavigationScroll from 'layout/NavigationScroll';
import ThemeCustomization from 'themes';

// auth provider
import { AuthProvider } from 'contexts/AuthContext';
import { DialogProvider } from 'contexts/DialogContext';
import { SnackbarProvider } from 'contexts/SnackbarContext';

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <AuthProvider>
      <ThemeCustomization>
        <NavigationScroll>
          <SnackbarProvider>
            <DialogProvider>
              <RouterProvider router={router} />
            </DialogProvider>
          </SnackbarProvider>
        </NavigationScroll>
      </ThemeCustomization>
    </AuthProvider>
  );
}
