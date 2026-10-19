#!/bin/bash
# Aggiornamento giornaliero dei prezzi dei carburanti (MIMIT, IODL 2.0) dal Mac del progetto.
#
# Lavora in una copia separata del repository (clone di main in ~/.vod-carburanti/repo): non tocca mai la cartella
# di lavoro né il branch su cui si sta sviluppando. Committa e pubblica SOLO
# web/src/data/mimit-fuel-venezia.json, e solo se i prezzi sono cambiati.
#
# Il push usa una deploy key SSH con permesso di scrittura solo su questo repository (vedi README.md qui accanto).
# Lanciato ogni mattina da launchd (it.veniceopendata.carburanti.plist); a mano: bash update_fuel_prices.sh
set -euo pipefail

HOME_DIR="$HOME/.vod-carburanti"
WORKTREE="$HOME_DIR/repo"
KEY="$HOME_DIR/deploy_key"
REMOTE="git@github.com:bitcoininvenice/vod-venice-open-data.git"
FILE="web/src/data/mimit-fuel-venezia.json"
EMAIL="92333930+bitcoininvenice@users.noreply.github.com"
LOG="$HOME/Library/Logs/vod-carburanti.log"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

mkdir -p "$HOME_DIR" "$(dirname "$LOG")"
exec >>"$LOG" 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') aggiornamento prezzi carburanti"

fail() {
  echo "ERRORE: $1"
  osascript -e "display notification \"$1\" with title \"VOD – prezzi carburanti\"" >/dev/null 2>&1 || true
  exit 1
}

[ -f "$KEY" ] || fail "manca la deploy key in $KEY (vedi pipeline/fuel_auto/README.md)"

# copia separata del repository, sempre allineata a main
if [ ! -d "$WORKTREE/.git" ]; then
  git clone -q --branch main "$REMOTE" "$WORKTREE" || fail "clone del repository non riuscito"
fi
cd "$WORKTREE"
git fetch -q "$REMOTE" main || fail "fetch di main non riuscito"
git checkout -q --detach FETCH_HEAD || fail "checkout di main non riuscito"

before=$(git hash-object "$FILE" 2>/dev/null || echo none)
python3 pipeline/import_mimit_fuel.py || fail "prezzi del Ministero non scaricati (il file resta quello di prima)"
after=$(git hash-object "$FILE")
if [ "$before" = "$after" ]; then
  echo "nessun cambiamento"
  exit 0
fi

# solo il file dei prezzi, mai altro
extracted=$(python3 -c "import json;print(json.load(open('$FILE'))['extractedAt'])")
day=$(python3 -c "import sys;y,m,d='$extracted'.split('-');print(f'{d}/{m}/{y}')")
git add -- "$FILE"
other=$(git diff --cached --name-only | grep -vx "$FILE" || true)
[ -z "$other" ] || fail "nell'area di commit ci sono altri file: $other"
git -c user.name=bitcoininvenice -c user.email="$EMAIL" commit -q -m "Carburanti: prezzi del $day" -- "$FILE"

for attempt in 1 2 3; do
  if git push -q "$REMOTE" HEAD:main; then
    echo "pubblicati i prezzi del $day"
    exit 0
  fi
  # nel frattempo main è avanzato: si riparte da lì e si rimette solo il file dei prezzi
  git fetch -q "$REMOTE" main && git rebase -q FETCH_HEAD || fail "riallineamento con main non riuscito"
  sleep $((attempt * 10))
done
fail "push non riuscito"
