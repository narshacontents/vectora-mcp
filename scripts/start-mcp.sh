#!/bin/sh
# The packaged MCP config embeds this script. Keep stdout exclusively for MCP JSON-RPC.
set -eu

# AppImages must already be executable; never change permissions or disable sandboxing here.
if [ "$(uname -s)" = Linux ]; then
  vectora_config="${XDG_CONFIG_HOME:-$HOME/.config}/Vectora/mcp-app-path"
  vectora_app=${VECTORA_APP_PATH:-}
  vectora_override=${vectora_app:+yes}
  if [ -z "$vectora_app" ] && [ -f "$vectora_config" ]; then
    IFS= read -r vectora_app < "$vectora_config" || true
  fi
  if [ -n "$vectora_app" ] && [ -f "$vectora_app" ] && [ -x "$vectora_app" ]; then
    :
  elif [ -n "$vectora_override" ]; then
    printf '%s\n' 'Vectora MCP: VECTORA_APP_PATH must be an executable Linux AppImage or Vectora binary.' >&2
    exit 69
  else
    vectora_app=
    for vectora_candidate in "$HOME/Applications/Vectora.AppImage" "$HOME/Applications"/Vectora-*-linux-x64.AppImage "$HOME/.local/bin/Vectora.AppImage" "$HOME/.local/bin"/Vectora-*-linux-x64.AppImage "$HOME/.local/bin/vectora" /opt/Vectora/Vectora.AppImage /opt/Vectora/Vectora-*-linux-x64.AppImage /opt/Vectora/vectora-studio /usr/local/bin/vectora /usr/bin/vectora-studio; do
      if [ -f "$vectora_candidate" ] && [ -x "$vectora_candidate" ]; then
        vectora_app=$vectora_candidate
        break
      fi
    done
  fi
  if [ -z "$vectora_app" ]; then
    printf '%s\n' 'Vectora MCP: Linux Vectora AppImage not found. Install Vectora 2.2.2 or later, chmod +x the AppImage, then set VECTORA_APP_PATH or ~/.config/Vectora/mcp-app-path.' >&2
    exit 69
  fi
  unset ELECTRON_RUN_AS_NODE
  exec "$vectora_app" --mcp-stdio
fi

vectora_config="$HOME/Library/Application Support/Vectora/mcp-app-path"
vectora_app=${VECTORA_APP_PATH:-}
vectora_override=${vectora_app:+yes}

if [ -z "$vectora_app" ] && [ -f "$vectora_config" ]; then
  IFS= read -r vectora_app < "$vectora_config" || true
fi

if [ -n "$vectora_app" ] && [ -x "$vectora_app/Contents/MacOS/Vectora" ]; then
  :
elif [ -n "$vectora_override" ]; then
  printf '%s\n' 'Vectora MCP: VECTORA_APP_PATH does not point to a Vectora.app bundle.' >&2
  exit 69
else
  vectora_app=
  for vectora_candidate in /Applications/Vectora.app "$HOME/Applications/Vectora.app"; do
    if [ -x "$vectora_candidate/Contents/MacOS/Vectora" ]; then
      vectora_app=$vectora_candidate
      break
    fi
  done
fi

if [ -z "$vectora_app" ]; then
  printf '%s\n' 'Vectora MCP: Vectora.app was not found. Install Vectora 1.0.0 or later, or set its path in ~/Library/Application Support/Vectora/mcp-app-path.' >&2
  exit 69
fi

vectora_binary="$vectora_app/Contents/MacOS/Vectora"
if [ ! -x "$vectora_binary" ]; then
  printf '%s\n' 'Vectora MCP: the selected Vectora.app has no executable. Update the configured app path.' >&2
  exit 69
fi

vectora_version=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$vectora_app/Contents/Info.plist" 2>/dev/null || true)
if ! awk -v version="$vectora_version" 'BEGIN {
  if (version == "") exit 1
  sub(/^v/, "", version)
  sub(/\+.*/, "", version)
  prerelease = 0
  if (version ~ /-/) {
    sub(/-.*/, "", version)
    prerelease = 1
  }
  if (version !~ /^[0-9]+\.[0-9]+\.[0-9]+$/) exit 1
  split(version, part, "[.]")
  major = part[1] + 0
  minor = part[2] + 0
  patch = part[3] + 0
  if (major > 1 || (major == 1 && minor > 0) || (major == 1 && minor == 0 && patch > 0)) exit 0
  if (major == 1 && minor == 0 && patch == 0 && !prerelease) exit 0
  exit 1
}'; then
  printf '%s\n' 'Vectora MCP: version 1.0.0 or later is required. Update Vectora or choose another app.' >&2
  exit 69
fi

unset ELECTRON_RUN_AS_NODE
exec "$vectora_binary" --mcp-stdio
