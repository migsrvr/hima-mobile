# Run Hima on a physical Android phone from Windows

## USB workflow (preferred, 2026-10-14)

Use a USB data cable with USB debugging enabled and accept the debugging prompt on the phone. The phone reaches the PC's backend through `adb reverse`, using `http://127.0.0.1:3001`. No Wi-Fi address is needed. The PC still needs internet for Groq, Paiflow, and Stellar.

Start the backend in **Windows PowerShell**:

```powershell
cd C:\Users\Miggy\Documents\Paiflow\server
npm.cmd run build
npm.cmd start
```

For the existing **debug/development APK**, start Metro in another Windows terminal:

```powershell
cd C:\Users\Miggy\Documents\Paiflow\mobile
npm.cmd run start:usb:windows
```

The launcher selects the USB device, forwards ports 3001 and 8081, checks backend health from Windows, and starts Metro with the API URL set to `http://127.0.0.1:3001`. Open `http://127.0.0.1:8081` in Hima's development launcher, or press `a` in Metro. Reload the app if it was using a previous Metro session.

For a **release APK** with embedded JavaScript, rebuild/install once with the USB URL and matching native HTTP policy:

```powershell
cd C:\Users\Miggy\Documents\Paiflow\mobile
npm.cmd run android:windows -- --usb --variant release
```

The build launcher applies Expo config plugins before compiling, including when `android/` already exists. The `withLocalApi` plugin permits HTTP only for the hostname in `EXPO_PUBLIC_API_URL`; other destinations keep the Android HTTPS default. `--usb` sets that URL to `http://127.0.0.1:3001` for both native configuration and JavaScript bundling. Other release builds must supply an explicit `EXPO_PUBLIC_API_URL` to avoid silently shipping the emulator-only default.

The launcher reads the selected phone's `model:` from `adb devices -l` for Expo's `--device` argument. Expo SDK 57 matches device names, while ADB forwarding and `ANDROID_SERIAL` use the serial. If two attached devices have the same model name, disconnect the other one before building.

On later USB reconnects, a release APK only needs the backend running and forwarding restored:

```powershell
cd C:\Users\Miggy\Documents\Paiflow\mobile
npm.cmd run usb:windows
```

From the phone browser, `http://127.0.0.1:3001/health` should return `status: "ok"`. Keep the cable connected. Forwarding must be restored after an ADB/device restart or when it disappears after reconnecting. A release APK uses its embedded API URL; restarting Metro does not change it.

**Diagnosis from local artifacts:** the inspected `app-release.apk` embeds `http://10.0.2.2:3001`, has no LAN API address, targets Android 36, and its merged release manifest has neither a cleartext allowance nor a network-security configuration. This prevents the current release build from reaching the local HTTP backend on a physical phone. The debug APK has no embedded bundle and does allow HTTP; its API URL depends on the Metro session. The local `server/.env` already has `HOST=0.0.0.0`, so a loopback-only server setting is not the cause visible in configuration.

Device/host verification must run from Windows: this Codex sandbox cannot open network sockets or execute Windows ADB (`UtilBindVsockAnyPort: socket failed 1`). The current APK artifacts are the old builds until the rebuild above completes.

References: [React Native USB port forwarding](https://reactnative.dev/docs/running-on-device), [Expo environment variables](https://docs.expo.dev/guides/environment-variables/), [Android network security configuration](https://developer.android.com/privacy-and-security/security-config).

## Earlier LAN workflow (optional alternative)

Hima uses Expo SDK 57, `expo-dev-client`, and native NFC code. Install a **Hima development APK** before opening Metro's development-client QR code. Expo Go does not contain this app's custom native modules. The existing EAS `development` profile creates that APK; the `preview` profile creates a standalone app that does not connect to Metro.

In WSL 2 NAT mode, `172.17.250.16` is the Linux VM's internal address. A phone on Wi-Fi cannot ordinarily reach that address. Windows localhost forwarding alone does not expose the VM to other Wi-Fi devices. The phone needs a reachable Windows address, currently `192.168.1.38`, plus a server listening there and a permitted firewall path. No Metro bundle request after scanning is consistent with an unreachable server or a missing development app; it does not establish a JavaScript compile failure.

The current shared dependency tree contains Linux native binaries and is missing the Windows Lightning CSS/resolver binaries. Install dependencies with Windows Node before launching on Windows. Earlier local Expo logs include successful Windows Android bundle exports, while recent WSL logs show a missing `libnspr4.so` for the optional React Native DevTools shell. That DevTools warning is separate from phone connectivity.

The AI service defaults to emulator-only `10.0.2.2:3001`. The launcher below sets `EXPO_PUBLIC_API_URL` to the Windows LAN address for this Metro session. It also forces the QR URL to the same Windows address. No application screens or budget logic are changed.

## 1. Start Metro in native Windows PowerShell

Stop the existing WSL Metro terminal with Ctrl+C first. Open **Windows PowerShell**, not a WSL tab:

```powershell
cd C:\Users\Miggy\Documents\Paiflow\mobile
node -p "process.platform + ' ' + process.arch"
npm.cmd install --include=optional
npm.cmd run start:windows -- 192.168.1.38
```

The first command must report `win32` (normally `win32 x64`). `npm.cmd` works even when PowerShell's execution policy prevents running `npm.ps1`; no execution-policy change is necessary. If the IP changes, use the IPv4 address under the Wi-Fi adapter in `ipconfig`. The launcher checks that the selected address belongs to Windows and that port 8081 is free before starting Metro.

Use Windows for dependency installation and Metro going forward. Switching `npm install` between WSL and Windows in the same `node_modules` tree can replace platform binaries and command shims. If installation reports unresolved native bindings, stop Metro and reinstall the dependencies from Windows; do not change Expo package versions just to address a networking issue.

Both devices must be on the same usable Wi-Fi network, with no guest/client isolation or conflicting VPN route. On the phone, open:

```text
http://192.168.1.38:8081/status
```

Expected response: `packager-status:running`. Test this before scanning again. A timeout means the phone still cannot reach Metro; changing app code will not fix that path.

## 2. Install the correct Android APK

From a second Windows terminal in `mobile/`, check the existing build rather than starting another one:

```powershell
npx.cmd eas-cli@latest build:list --platform android --build-profile development --limit 3 --non-interactive
```

If Windows EAS is not logged in, run `npx.cmd eas-cli@latest login` and repeat the check. WSL and Windows can have separate Expo login state. Wait for a development build with status **FINISHED**, open its build details, and download/install its APK on the phone. A queued/in-progress build cannot be installed yet. An errored build needs its build logs reviewed.

You can also inspect the [Hima build dashboard](https://expo.dev/accounts/migsrvr/projects/hima/builds) in a browser signed in to the project account.

Open the installed **Hima** app and scan the QR with its launcher or a system QR reader. If QR dispatch does not work but `/status` is reachable, enter this server URL directly in Hima's development launcher:

```text
http://192.168.1.38:8081
```

If the phone has a standalone preview APK instead, install the development-profile APK to use Metro. A preview build normally runs its embedded JavaScript without Metro logs.

## 3. Run the API on Windows for live AI

Stop any existing backend occupying port 3001 before moving it. In another Windows PowerShell terminal:

```powershell
cd C:\Users\Miggy\Documents\Paiflow\server
npm.cmd install
$env:HOST = '0.0.0.0'
npm.cmd run build
npm.cmd start
```

The existing local `server/.env` supplies the API key. Never put that key in an `EXPO_PUBLIC_*` variable. From the phone, open `http://192.168.1.38:3001/health`; expect `{"status":"ok","ai":true,"payments":true}`. An unreachable API can cause local AI fallback even after the app itself opens correctly.

## 4. If the phone cannot reach `/status`

Check from Windows PowerShell:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8081,3001
Get-NetConnectionProfile
curl.exe http://127.0.0.1:8081/status
curl.exe http://192.168.1.38:8081/status
```

If Windows can reach both URLs but the phone cannot, inspect the Windows Firewall permission for Node.js and the Wi-Fi router's guest/client-isolation settings. On a trusted private home network, an administrator can create a rule limited to the development ports and local subnet:

```powershell
New-NetFirewallRule -DisplayName 'Hima Windows development' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081,3001 -Program (Get-Command node.exe).Source -Profile Private -RemoteAddress LocalSubnet
```

This command changes Windows Firewall policy and requires Administrator PowerShell. It has not been executed by this debugging session. It applies only when the connected network's profile is Private. Keep the firewall enabled.

As an alternative when LAN access is unavailable, stop the LAN launcher and run `npx.cmd expo start --dev-client --tunnel`. Expo may request installation of its ngrok helper. A tunnel changes only Metro's reachability; the API on port 3001 still needs its own reachable address. A tunnel also cannot replace the missing development APK.

## Alternative: keep Metro inside WSL

This path requires Windows admin port-proxy/firewall configuration. Choose it only if you want to keep running Metro in WSL. Do not also run a Windows Metro on port 8081.

First determine the current WSL VM address in Windows PowerShell:

```powershell
wsl.exe -d Ubuntu hostname -I
```

Use the VM's IPv4 address (previously `172.17.250.16`). The address can change after a WSL restart. In **Administrator PowerShell**:

```powershell
netsh interface portproxy add v4tov4 listenaddress=192.168.1.38 listenport=8081 connectaddress=172.17.250.16 connectport=8081
New-NetFirewallRule -DisplayName 'Hima WSL Metro' -Direction Inbound -Action Allow -Protocol TCP -LocalAddress 192.168.1.38 -LocalPort 8081 -Profile Private -RemoteAddress LocalSubnet
netsh interface portproxy show all
```

Start Metro in WSL with a Windows address in the advertised URL:

```bash
cd /mnt/c/Users/Miggy/Documents/Paiflow/mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.38 \
EXPO_PACKAGER_PROXY_URL=http://192.168.1.38:8081 \
EXPO_PUBLIC_API_URL=http://192.168.1.38:3001 \
npx expo start --dev-client --lan --port 8081 --clear
```

The phone still connects to `192.168.1.38:8081`, not the VM IP. For an API also kept in WSL, bind it to `HOST=0.0.0.0`, add an equivalent port proxy for port 3001, and add a Private/LocalSubnet firewall rule for port 3001. Recheck `/status` and `/health` from the phone. These admin changes have not been applied automatically.

## Compiling a new APK locally on Windows

Windows supports local Android builds with Android Studio, an Android SDK, Java 17, USB debugging, and the phone connected. The CLI generates the native Android project through Expo Prebuild.

The `android:windows` launcher selects the installed Microsoft JDK 17 and the SDK at `%LOCALAPPDATA%\Android\Sdk`. It sets `JAVA_HOME`, the SDK variables, and `Path` only for the build process, so Java 8 elsewhere on the machine does not take precedence. It checks Platform 36, Build-Tools 36.0.0, Platform-Tools, and Command-line Tools (latest) before starting Expo. Optional `HIMA_JAVA_HOME` and `HIMA_ANDROID_SDK` variables can specify other installation paths.

```powershell
cd C:\Users\Miggy\Documents\Paiflow\mobile
npm.cmd run android:windows -- --check
# With the phone connected and USB debugging enabled:
npm.cmd run android:windows -- --device
# For a release build with embedded JavaScript:
npm.cmd run android:windows -- --variant release --device
```

Toolchain inspection on 2026-10-14 found Microsoft Java 17, Platform 37.0, Build-Tools 36.0.0, and Platform-Tools installed. Platform 36 and Command-line Tools were missing. Install those two components through Android Studio > SDK Manager. The NDK is also not installed; Gradle may request additional project-pinned native build components during the first build.

The project uses Android Gradle Plugin 8.12.0 and Expo SDK 57's Platform 36 defaults. Android's compatibility table requires AGP 9.1.1 or newer for Platform 37.0, so the launcher does not force a Platform 37 override. That would require a separate native toolchain migration. Platform 37 can remain installed alongside Platform 36. See the [Android API/AGP compatibility table](https://developer.android.com/build/releases/about-agp).

The new launcher's syntax and ESLint checks pass, and the application TypeScript check passes. Full application lint still reports the existing `react-hooks/set-state-in-effect` error in `components/payment/AuthorizeSheet.tsx:37`. The launcher correctly refuses WSL execution; Windows execution and an APK build have not been verified in this sandbox. No SDK packages, global environment settings, or native project files were changed by this configuration update.

`eas build --local` is a different workflow and is not supported natively on Windows. Running Metro on Windows does not require a new APK if a compatible Hima development APK is already installed.

## Verification checkpoint — 2026-10-13

Confirmed from local files: development-client/NFC dependencies, development APK profile, missing Windows optional binaries, emulator-only default API address, and earlier successful Windows Android bundle exports. The Windows launcher refuses WSL execution and validates native dependencies, host IP, and port selection before launching.

Checks: launcher syntax and its expected WSL refusal pass; the launcher's ESLint check and the application TypeScript check pass; direct dependency versions and package-lock dependency maps are consistent. Full application lint reports an existing `react-hooks/set-state-in-effect` error in `components/payment/AuthorizeSheet.tsx:37`; that UI file was not changed for this connection task.

This Codex sandbox blocks Windows interop (`UtilBindVsockAnyPort: socket failed 1`) and network DNS (`api.expo.dev`), so the EAS build-list attempt failed before returning build status. Windows Metro/firewall/phone reachability must be checked on the host; no current EAS build status is inferred from old local bundle logs.

References: [Expo CLI](https://docs.expo.dev/more/expo-cli/), [Using development builds](https://docs.expo.dev/develop/development-builds/use-development-builds/), [Installing Android APKs](https://docs.expo.dev/build-reference/apk/), [Local Android compilation](https://docs.expo.dev/guides/local-app-development/), [EAS local-build limitations](https://docs.expo.dev/build-reference/local-builds/), [Microsoft WSL networking](https://learn.microsoft.com/en-us/windows/wsl/networking).
