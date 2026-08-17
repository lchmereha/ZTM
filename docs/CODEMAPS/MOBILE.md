# Mobile Codemap

**Last Updated:** 2026-06-19
**Platform:** Flutter (Dart SDK 3.12)
**Entry Point:** `lib/main.dart`
**State Management:** GetX (Get) + GetStorage

---

## Project Overview

The mobile app provides RFID reading, barcode scanning, and ZPL label printing capabilities for warehouse operators. It connects to the ZTM backend via REST API and WebSocket for real-time RFID tag operations.

---

## Structure

```
mobile/
├── lib/
│   ├── main.dart               # App entry point, dependency injection
│   └── src/
│       ├── app.dart            # MaterialApp config, routing, localization
│       ├── components/         # Reusable UI components
│       ├── constants/          # App constants
│       ├── localization/       # Portuguese localization (intl + ARB)
│       ├── models/             # Data models
│       ├── modules/            # Feature modules (controllers + views)
│       ├── routes/             # Named routes and page bindings
│       ├── services/           # Business logic services
│       └── utils/              # Utility functions
├── android/                    # Android platform config
├── assets/                     # Images, fonts
├── pubspec.yaml                # Dependencies
└── flutter_launcher_icons.yaml # App icon config
```

---

## App Initialization Flow

```
main.dart
  └── EnvironmentManager.init()  ← loads .env
       └── GetMaterialApp (app.dart)
            ├── Translations (app_localizations)
            ├── Theme: Material Symbols Icons
            └── Routes (app_pages.dart)
                 ├── /login  → LoginModule
                 └── /home   → HomeModule
```

---

## Modules

### Login Module (`modules/login/`)
**Pages:** Login view, server configuration

| File | Purpose |
|------|---------|
| `controllers/login_controller.dart` | Login form state, authentication logic |
| `views/login_view.dart` | Login UI (server URL, credentials) |

### Home Module (`modules/home/`)
**Pages:** Main RFID operations dashboard

| File | Purpose |
|------|---------|
| `controllers/home_controller.dart` | Home state, active movement tracking |
| `views/home_view.dart` | Main dashboard with operation options |
| `widgets/` | Home screen widgets |

---

## Services (`services/`)

### API Services (`services/api/`)

| Service | File | Purpose |
|---------|------|---------|
| Auth API | `auth/auth_api.dart` | Login/refresh API calls |
| Movement API | `movimentacao/movimentacao_api.dart` | Movement CRUD + batch operations |

### HTTP Client (`services/http/`)

| File | Purpose |
|------|---------|
| `http.dart` | Base HTTP client, cookie management, error handling |
| `api_exception.dart` | Structured API exception class |

### Hardware Services

| Service | File | Purpose |
|---------|------|---------|
| RFID Reader | `rfid/rfid.dart` | RFID tag reading via custom package |
| Barcode Scanner | `scanner/scanner.dart` | Barcode scanning via custom package |
| ZPL Print | `zpl/zpl_print_service.dart` | ZPL label printing over TCP socket |

### Infrastructure Services

| Service | File | Purpose |
|---------|------|---------|
| Environment | `environment/env_manager.dart` | .env file loading |
| Logging | `log/log.dart` | App logging |
| Settings | `settings/settings.dart` | Persistent settings (GetStorage) |
| Snackbar | `snackbar/snackbar.dart` | Toast notifications |
| WebSocket | — | Real-time RFID tag stream (handled via RfidWebSocketService on frontend) |

---

## Components (`components/`)

### RFID Reader Panel (`components/rfid_reader_panel/`)

| Component | Purpose |
|-----------|---------|
| `rfid_reader_panel.dart` | Main RFID reader control panel |
| `action_bar.dart` | Read/stop action buttons |
| `buzzer.dart` | Buzzer control |
| `connection_header.dart` | Connection status header |
| `filtro_rssi.dart` | RSSI filter slider |
| `lotes_leitura.dart` | Read batch counter |
| `potencia.dart` | Antenna power control |
| `select_device.dart` | BLE device selection |
| `tag_focus.dart` | Tag focus/deduplication settings |
| `websocket_uri.dart` | WebSocket URI configuration |

### Dialogs (`components/dialogs/`)

| Dialog | Purpose |
|--------|---------|
| `ble_scan.dart` | BLE device scanning dialog |
| `boolean.dart` | Yes/no confirmation dialog |
| `error.dart` | Error message dialog |
| `loading.dart` | Loading spinner dialog |
| `select_device.dart` | Device selection dialog |

### Other Components

| Component | File | Purpose |
|-----------|------|---------|
| Tag List | `tag_list/tag_list.dart` | Scanned RFID tag list display |
| Barcode Scan | `barcode_scan.dart` | Barcode scan trigger |
| Collapsible FAB | `collapsable_fab.dart` | Expandable floating action button |
| Text Scroll | `text_scroll_wrapper.dart` | Auto-scrolling text for long RFID codes |

---

## Models (`models/`)

| Model | File | Purpose |
|-------|------|---------|
| LoginResponse | `login_response.dart` | Auth response with tokens/user |
| Movimentacao | `movimentacao.dart` | Movement data |
| ScannedTagItem | `scanned_tag_item.dart` | Individual tag scan record |
| ServerConfig | `server_config.dart` | Server connection settings |
| Utils | `utils/` | Model helper utilities |

---

## Routing (`routes/`)

| File | Purpose |
|------|---------|
| `app_routes.dart` | Route name constants |
| `app_pages.dart` | Route → Module binding (GetX routing) |

**Named Routes:**
- `/login` — Login page
- `/home` — Main home/dashboard

---

## Constants (`constants/`)

| File | Purpose |
|------|---------|
| `constants.dart` | App-wide constants |
| `endpoints.dart` | Backend API endpoint paths |
| `sizes.dart` | UI size constants |

---

## Localization (`localization/`)

| File | Type | Purpose |
|------|------|---------|
| `app_localizations.dart` | Dart class | Localization delegate |
| `app_localizations_pt.dart` | Dart class | Portuguese translations |
| `app_pt.arb` | ARB file | Portuguese resource bundle |
| `app_pt_BR.arb` | ARB file | Brazilian Portuguese resource bundle |

---

## External Hardware Dependencies

| Package | Path | Purpose |
|---------|------|---------|
| `barcode_scanner` | `../../../Flutter/packages/barcode_scanner` | Camera-based barcode scanning |
| `rfid_reader` | `../../../Flutter/packages/rfid_reader` | BLE RFID reader communication |

---

## Key Flows

### RFID Tag Reading Flow
```
1. User opens movement → HomeModule
2. Connects to RFID reader via BLE (flutter_blue_plus)
3. WebSocket connects to backend for real-time tag stream
4. Tags scanned → displayed in tag_list
5. User taps "Concluir" → batch sent to backend
6. POST /movimentacao/:id/leitura/concluir-lotes
```

### ZPL Label Printing Flow
```
1. User selects products for label printing
2. ZPL template fetched from backend
3. ZPL code sent to printer via TCP socket
4. Confirmation displayed to user
```

### Barcode Scanning Flow
```
1. User activates barcode scan from movement screen
2. Camera scans barcode via custom package
3. Code looked up via backend API
4. Result (product/tag) shown in UI
```
