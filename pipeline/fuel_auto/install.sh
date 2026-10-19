#!/bin/bash
# Installa l'aggiornamento giornaliero dei prezzi dei carburanti sul Mac (una volta sola).
#   1. crea la deploy key in ~/.vod-carburanti/deploy_key (se manca) e ne mostra la parte pubblica
#   2. installa e attiva il job di launchd
# Disinstallare: bash install.sh --uninstall
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
HOME_DIR="$HOME/.vod-carburanti"
KEY="$HOME_DIR/deploy_key"
PLIST="$HOME/Library/LaunchAgents/it.veniceopendata.carburanti.plist"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Aggiornamento automatico disattivato. La chiave resta in $KEY (cancellala e toglila da GitHub se non serve più)."
  exit 0
fi

mkdir -p "$HOME_DIR" "$HOME/Library/LaunchAgents"
chmod 700 "$HOME_DIR"
if [ ! -f "$KEY" ]; then
  ssh-keygen -t ed25519 -N "" -C "vod-carburanti (solo prezzi carburanti)" -f "$KEY" >/dev/null
  echo "Creata la deploy key."
fi
echo
echo "Chiave pubblica da aggiungere su GitHub → repository → Settings → Deploy keys → Add deploy key,"
echo "titolo «VOD prezzi carburanti», spunta «Allow write access»:"
echo
cat "$KEY.pub"
echo

# lo script si copia fuori dal repository: resta valido anche cambiando branch
cp "$DIR/update_fuel_prices.sh" "$HOME_DIR/update_fuel_prices.sh"
sed "s#__SCRIPT__#$HOME_DIR/update_fuel_prices.sh#" "$DIR/it.veniceopendata.carburanti.plist" > "$PLIST"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Job attivo: ogni giorno alle 9:15. Registro: ~/Library/Logs/vod-carburanti.log"
echo "Prova subito (dopo aver aggiunto la chiave su GitHub): launchctl kickstart gui/$(id -u)/it.veniceopendata.carburanti"
