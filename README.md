# qbt-webui

A custom web UI for qBittorrent, built as a clean-room replacement for the default interface. Designed for self-hosted, LAN-accessible deployments on headless servers running qbittorrent-nox.

## Features

- Real-time torrent list with delta sync via qBittorrent's `sync/maindata` API
- Adaptive polling — fast when active, slow when idle
- Full inspector panel: General, Files, Peers, Trackers
- Context menu actions: start, pause, force start, verify, reannounce, set location, rename, set seed ratio, sequential download, super seeding, queue priority
- Category and filter sidebar with live counts
- Split download/upload speed popovers
- Settings panel covering speed, downloads, seeding, peers, queue, and about
- Add torrent panel: drag-and-drop .torrent file or magnet link
- Connection status indicator (connected / firewalled / disconnected / unreachable)
- Warm neutral design system with copper-amber accent

## Requirements

- qBittorrent 4.1+ (Web API v2)
- nginx (or any reverse proxy) to serve static files and proxy `/api/` to the qBittorrent daemon
- qbittorrent-nox bound to `127.0.0.1` only

## Setup

1. Clone this repo to your web root, e.g. `/var/www/qbittorrent`
2. Configure nginx to serve the directory and proxy `/api/` to `http://127.0.0.1:8090`
3. In qBittorrent settings set `WebUI\AlternativeUIEnabled=false` — the UI is served by nginx, not qBittorrent itself
4. Set `WebUI\LocalHostAuth=false` so nginx proxying from localhost bypasses authentication
5. Optionally set `WebUI\AuthSubnetWhitelistEnabled=true` with your LAN subnet to bypass auth entirely from trusted networks

## nginx config example

```nginx
server {
    listen 443 ssl;
    server_name your.domain.example;

    root /var/www/qbittorrent;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_read_timeout 300s;
        proxy_buffering    off;
    }
}
```

## Architecture

Single-file vanilla JS application — no framework, no build step. Three files:

- `index.html` — markup and modal templates
- `app.js` — all application logic in a single IIFE
- `app.css` — all styles, driven by a design token system defined in `DESIGN_SYSTEM.md`

The API layer uses qBittorrent's native Web API v2. No session token management is required when accessing from a whitelisted subnet.

## License

Copyright (C) 2026 cantcodewontcode

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

In addition, as a special exception, the copyright holders give permission
to link this program with the OpenSSL project's "OpenSSL" library (or with
modified versions of it that use the same license as the "OpenSSL" library),
and distribute the linked executables. You must obey the GNU General Public
License in all respects for all of the code used other than "OpenSSL".
