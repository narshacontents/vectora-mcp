#!/bin/sh
set -eu
vectora_app=${1:-}
if [ "$(uname -s)" = Linux ]; then
  case "$vectora_app" in /*) ;; *) echo 'Usage: configure-app.sh /absolute/path/Vectora.AppImage' >&2; exit 64 ;; esac
  if [ ! -f "$vectora_app" ] || [ ! -x "$vectora_app" ]; then echo 'Executable Vectora AppImage not found.' >&2; exit 66; fi
  vectora_directory="${XDG_CONFIG_HOME:-$HOME/.config}/Vectora"
else
  case "$vectora_app" in /*.app) ;; *) echo 'Usage: configure-app.sh /absolute/path/Vectora.app' >&2; exit 64 ;; esac
  if [ ! -x "$vectora_app/Contents/MacOS/Vectora" ]; then echo 'Vectora executable not found.' >&2; exit 66; fi
  vectora_directory="$HOME/Library/Application Support/Vectora"
fi
mkdir -p "$vectora_directory"
vectora_temp=$(mktemp "$vectora_directory/.mcp-app-path.XXXXXX")
# The temporary file is atomically moved into place below.
printf '%s\n' "$vectora_app" > "$vectora_temp"
mv -f "$vectora_temp" "$vectora_directory/mcp-app-path"
printf 'Vectora MCP app: %s\n' "$vectora_app"
