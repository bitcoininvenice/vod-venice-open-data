# Istruzioni di Build e Distribuzione - Venice Open Data Mobile

Questo documento descrive come compilare l'applicazione Flutter sia per Android (APK) che per iOS (IPA per sideloading/AltStore) senza obbligo di account Apple Developer a pagamento.

---

## 1. Prerequisiti
- Flutter SDK (versione 3.19.0 o successiva, canale stable)
- Dart SDK incluso
- Android Studio / Android SDK (per build Android)
- Xcode (su macOS, per build iOS)

---

## 2. Installazione Dipendenze
Dalla cartella `mobile/`, eseguire:

```bash
flutter pub get
```

---

## 3. Build Android (APK)

### 3.1 APK Universale (Release)
```bash
flutter build apk --release
```
L'APK compilato sara disponibile in:
`build/app/outputs/flutter-apk/app-release.apk`

### 3.2 APK Ottimizzati per Architettura (Consigliato per dimensioni ridotte)
```bash
flutter build apk --split-per-abi
```
Genera tre APK leggeri (~15-20 MB ciascuno):
- `app-arm64-v8a-release.apk` (per la quasi totalita degli smartphone moderni)
- `app-armeabi-v7a-release.apk` (per dispositivi datati a 32 bit)
- `app-x86_64-release.apk` (per emulatori)

---

## 4. Build iOS (IPA per Sideload / AltStore / Sideloadly)

Se non si dispone di un account Apple Developer a pagamento (99 USD/anno), e possibile generare un pacchetto IPA non firmato o con firma personale (*free provisioning*) per installarlo direttamente tramite AltStore, Sideloadly o Scarlet.

### 4.1 Compilazione del bundle iOS senza firma
```bash
flutter build ios --release --no-codesign
```

### 4.2 Creazione del pacchetto .IPA
Su macOS, eseguire i seguenti comandi da terminale nella root del progetto mobile:

```bash
mkdir -p build/ios/iphoneos/Payload
cp -r build/ios/iphoneos/Runner.app build/ios/iphoneos/Payload/
cd build/ios/iphoneos
zip -r vod_mobile.ipa Payload
rm -rf Payload
```

Il file `vod_mobile.ipa` e pronto per la distribuzione.

### 4.3 Installazione tramite AltStore o Sideloadly
1. Collegare l'iPhone al computer via cavo o Wi-Fi.
2. Aprire **AltStore** o **Sideloadly**.
3. Trascinare il file `vod_mobile.ipa`.
4. Inserire il proprio Apple ID personale per firmare il pacchetto (valido per 7 giorni, rinnovabile automaticamente via Wi-Fi tramite AltServer).
5. Sull'iPhone andare in: `Impostazioni -> Generali -> VPN e gestione dispositivi` e autorizzare lo sviluppatore.
