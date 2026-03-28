{
  "meta": {
    "lastTouchedVersion": "2026.3.13",
    "lastTouchedAt": "2026-03-27T14:36:28.470Z"
  },
  "env": {
  },
  "wizard": {
    "lastRunAt": "2026-03-27T14:36:28.258Z",
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
      "blink-V1": {
        "baseUrl": "https://core.blink.new/api/v1/ai",
        "apiKey": "blnk_ak_A0ho8AHVCoSztmCtciLJwqOo23okOEEdMLQ9IWFcJw-ehsC5",
        "api": "openai-completions",
        "models": [
          {
            "id": "gemini-3-flash",
            "name": "gemini-3-flash"
          }
        ]
      },
      "blink-V2": {
        "baseUrl": "https://core.blink.new/api/v1/ai",
        "apiKey": "blnk_ak__SM6OOBIu2_RW-2KSEiT7jSoW8pbyZG6uqMnN9XWDo_PdcK-",
        "api": "openai-completions",
        "models": [
          {
            "id": "gemini-3-flash",
            "name": "gemini-3-flash"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-5.1-codex-mini",
        "fallbacks": [
          "openai/gpt-5.1",
          "blink-V1/anthropic/claude-sonnet-4.6",
          "blink-V2/anthropic/claude-sonnet-4.6"
        ]
      },
      "models": {
        "openai/gpt-5.1-codex-mini": {},
        "openai/gpt-5.1": {},
        "openai/gpt-5.1-codex-max": {},
        "openai/gpt-5.2": {},
        "openai/gpt-5.4": {},
        "openrouter/arcee-ai/trinity-large-preview:free": {},
        "openrouter/arcee-ai/trinity-mini:free": {},
        "openrouter/google/gemma-3-27b-it:free": {},
        "openrouter/mistralai/mistral-small-3.1-24b-instruct:free": {},
        "openrouter/nvidia/nemotron-3-nano-30b-a3b:free": {},
        "openrouter/nvidia/nemotron-3-super-120b-a12b:free": {},
        "openrouter/nvidia/nemotron-nano-9b-v2:free": {},
        "openrouter/nvidia/nemotron-nano-12b-v2-vl:free": {},
        "openrouter/openai/gpt-oss-120b:free": {},
        "openrouter/qwen/qwen3-coder:free": {},
        "blink-V1/gemini-3-flash": {},
        "blink-V1/anthropic/claude-opus-4.6": {},
        "blink-V1/anthropic/claude-sonnet-4.6": {},
        "blink-V1/anthropic/claude-haiku-4.6": {},
        "blink-V2/gemini-3-flash": {},
        "blink-V2/anthropic/claude-opus-4.6": {},
        "blink-V2/anthropic/claude-sonnet-4.6": {},
        "blink-V2/anthropic/claude-haiku-4.6": {}
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
