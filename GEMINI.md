# Vectora in Gemini CLI

Activate the relevant root `skills/` skill on demand: `use-vectora` for editing or `create-kice-illustration` for assessment artwork. Follow the activated skill's selective reference loading; do not preload all rules. Never auto-activate or use `create-kice-science-illustration`: it is empty and unavailable, even if Gemini lists it as enabled. Report it unavailable when requested.

Use the actual exposed MCP tool names and schemas (including any client prefix), such as `vectora_status`, `vectora_open_document`, `vectora_inspect` and `vectora_save`. Pass real local file paths accessible to Vectora. This connects the installed desktop app to Gemini CLI; it does not connect Gemini web chat or supply an image-generation model.

Paths are relative to this extension's installed root. For a custom app location, use `scripts/configure-app.sh` on macOS or `scripts/configure-app.ps1` on Windows to persist it. Gemini filters extension environment variables, so do not assume shell `VECTORA_APP_PATH` is inherited.
