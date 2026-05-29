# NIX RUNTIME KNOWLEDGE BASE

## OVERVIEW
`infra/digitalocean-min/nix` defines NixOS host/container runtime for MediaMTX ingest and Caddy TLS proxying.

## STRUCTURE
```text
nix/
├── flake.nix         # deploy-rs entry and checks
├── configuration.nix # Host imports and baseline settings
├── mediamtx.nix      # Media ingest/auth service container
├── caddy.nix         # TLS proxy container
└── flake.lock        # Nix input lock file
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Deploy entry + checks | `flake.nix` | `deploy-rs` node/profile wiring |
| Host imports/baseline | `configuration.nix` | imports Caddy + MediaMTX modules |
| Media service container | `mediamtx.nix` | WHIP/RTSP/auth callback behavior |
| TLS proxy container | `caddy.nix` | cert paths + reverse proxy to 8889 |

## CONVENTIONS
- `configuration.nix` composes `caddy.nix` and `mediamtx.nix`; keep imports aligned.
- MediaMTX auth callback must match worker API contract (`/api/mediamtx/auth`).
- MediaMTX container exposes RTSP (`8554`) and WebRTC (`8889`) assumptions used by app/env.
- Caddy container terminates TLS for `webrtc.odango.app` and proxies to MediaMTX.
- Deploy target identity (`do-1`) and activation path are defined in `flake.nix`.

## ANTI-PATTERNS
- Do not change auth callback domain/path without syncing worker routes and Cloudflare domain config.
- Do not diverge `webrtc.odango.app` / `rtsp.odango.app` handling across Nix and app configs.
- Do not alter exposed port mappings without firewall and client endpoint validation.
- Do not store private cert material in tracked repository files.

## NOTES
- `mediamtx.nix` and `caddy.nix` are coupled through WebRTC port and proxy assumptions.
- Keep deploy target identity (`do-1`) stable unless DNS and automation are updated.
