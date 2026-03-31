{
  "meta": {
    "lastTouchedVersion": "2026.3.13",
    "lastTouchedAt": "2026-03-29T06:40:22.542Z"
  },
  "env": {},
  "wizard": {
    "lastRunAt": "2026-03-28T08:52:13.525Z",
    "lastRunVersion": "2026.3.13",
    "lastRunCommand": "configure",
    "lastRunMode": "local"
  },
  "auth": {
    "profiles": {
      "openai-codex:default": {
        "provider": "openai-codex",
        "mode": "oauth"
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "devora": {
        "baseUrl": "http://localhost:8317/v1",
        "apiKey": "Bandulan113",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.2-codex",
            "name": "GPT-5.2-Codex"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai-codex/gpt-5.1-codex-mini",
        "fallbacks": [
            "devora/gpt-5.1"
        ]
      },
      "models": {
        "openai-codex/gpt-5.1-codex-mini": {},
        "openai-codex/gpt-5.1": {},
        "devora/gpt-5-codex": {},
        "devora/gpt-5-codex-mini": {},
        "devora/gpt-5.1": {},
        "devora/gpt-5.1-codex": {},
        "devora/gpt-5.3-codex": {},
        "devora/gpt-5": {},
        "devora/gpt-5.1-codex-mini": {},
        "devora/gpt-5.1-codex-max": {},
        "devora/gpt-5.2": {},
        "devora/gpt-5.2-codex": {},
        "devora/gpt-5.4": {},
        "devora/devora-sonnet-4.6": {},
        "devora/qwen3-coder-plus": {},
        "devora/qwen3-coder-flash": {},
        "devora/devora-openrouter": {},
        "devora/devora-versatile": {}
      },
      "workspace": "/root/.openclaw/workspace"
    }
  },
  "tools": {
    "profile": "full",
    "web": {
      "search": {
        "enabled": false
      },
      "fetch": {
        "enabled": false
      }
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "session": {
    "dmScope": "per-channel-peer"
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "allowlist",
      "botToken": "8440727765:AAFniPMZi5dX9vCv146_P72OdNV19IFMEos",
      "allowFrom": [
        "1370196228"
      ],
      "groupPolicy": "allowlist",
      "streaming": "partial"
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "d8256a117d8b9850a569820fb2d1f83471e21e7408505d71"
    },
    "tailscale": {
      "mode": "off",
      "resetOnExit": false
    },
    "nodes": {
      "denyCommands": [
        "camera.snap",
        "camera.clip",
        "screen.record",
        "contacts.add",
        "calendar.add",
        "reminders.add",
        "sms.send"
      ]
    }
  },
  "plugins": {
    "entries": {
      "telegram": {
        "enabled": true
      }
    }
  }
}
