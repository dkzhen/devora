{
  "meta": {
    "lastTouchedVersion": "2026.3.13",
    "lastTouchedAt": "2026-03-28T08:52:13.642Z"
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
        "baseUrl": "https://beck--free--hdsl6n5gl5pq.code.run/v1",
        "apiKey": "@NOSTATEISTHEBESTSTATE",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5-codex",
            "name": "GPT-5 Codex"
          }
        ]
      },
      "blink":{
        "baseUrl": "https://core.blink.new/api/v1/ai",
        "apiKey": "blnk_ak_AnphqGPyjP1tP47fKNHiSbqGR0tctn4-9enc8uryJN-5p5Iw",
        "api": "openai-completions",
        "models": [
          {
            "id": "anthropic/claude-sonnet-4.6",
            "name": "Claude Sonnet 4.6"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "devora/gpt-5-codex",
        "fallbacks": [
          "devora/gpt-5",
          "devora/gpt-5-codex-mini",
          "devora/gpt-5.1-codex",
          "devora/gpt-5.1-codex-mini",
          "devora/gpt-5.2",
          "devora/gpt-5.3-codex",
          "devora/gpt-5.4",
          "devora/gpt-5.4-mini",
          "devora/gpt-5-codex"
        ]
      },
      "models": {
        "openai-codex/gpt-5.1-codex-mini": {},
        "openai-codex/gpt-5.1": {},
        "devora/gpt-5-codex": {},
        "blink/anthropic/claude-sonnet-4.6": {}

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
      "dmPolicy": "pairing",
      "botToken": "8440727765:AAFniPMZi5dX9vCv146_P72OdNV19IFMEos",
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
