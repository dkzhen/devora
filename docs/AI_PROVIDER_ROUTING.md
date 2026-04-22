# AI Provider Dynamic Routing

## Konsep

Sistem reverse proxy AI sekarang mendukung **dynamic routing per model** berdasarkan `baseUrl` yang disimpan di database.

## Cara Kerja

### 1. Default Behavior (Tanpa baseUrl)

Jika model tidak memiliki `baseUrl` di database, sistem akan menggunakan default dari environment variable:

```env
AI_PROXY_URL=http://localhost:8317
```

**Request Flow:**

```
Client → /api/v1/ai/chat/completions (model: gpt-4)
       → Database: model tidak ada baseUrl
       → Proxy ke: http://localhost:8317/v1/chat/completions
```

### 2. Custom baseUrl per Model

Jika model memiliki `baseUrl` di database, sistem akan route ke URL tersebut:

**Contoh di Database:**

```sql
INSERT INTO ai_models (id, name, owned_by, base_url) VALUES
('gpt-4', 'GPT-4', 'OpenAI', 'https://api.openai.com'),
('claude-3', 'Claude 3', 'Anthropic', 'https://api.anthropic.com'),
('llama-3', 'Llama 3', 'Meta', 'http://192.168.1.100:8080');
```

**Request Flow:**

```
Client → /api/v1/ai/chat/completions (model: claude-3)
       → Database: baseUrl = https://api.anthropic.com
       → Proxy ke: https://api.anthropic.com/v1/chat/completions
```

## Use Cases

### 1. Multi-Provider Setup

Setiap provider punya upstream server sendiri:

- OpenAI models → `https://api.openai.com`
- Anthropic models → `https://api.anthropic.com`
- Local models → `http://localhost:8080`

### 2. Load Balancing

Distribusi model ke berbagai server:

- `gpt-4` → Server A (http://vps1.example.com:8317)
- `gpt-3.5-turbo` → Server B (http://vps2.example.com:8317)

### 3. Private Model Hosting

Model pribadi dengan URL khusus:

- `user@email.com/custom-model` → `http://private-server.local:9000`

## Cara Setting di UI

1. Login sebagai **ULTRA** role
2. Buka halaman **AI Providers** (`/ai-providers`)
3. Klik **Add Model** atau **Edit** model yang ada
4. Isi field **Base URL** (optional):
   - Contoh: `https://api.openai.com`
   - Contoh: `http://192.168.1.100:8080`
   - Kosongkan untuk pakai default

## API Behavior

### Authorization Header

Semua request ke upstream tetap menggunakan token yang sama:

```javascript
Authorization: Bearer Bandulan113
```

Jika ingin custom token per model, bisa extend schema dengan field `apiToken`.

### URL Normalization

Sistem otomatis remove trailing slash:

- Input: `https://api.openai.com/` → Clean: `https://api.openai.com`
- Final URL: `https://api.openai.com/v1/chat/completions`

## Testing

### Test dengan curl:

```bash
curl -X POST https://your-domain.com/api/v1/ai/chat/completions \
  -H "Authorization: Bearer devora_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Check routing di logs:

```javascript
console.log("Routing to:", cleanBaseUrl);
```

## Security Notes

1. **HTTPS Recommended**: Gunakan HTTPS untuk production baseUrl
2. **Internal Networks**: Pastikan firewall allow jika pakai IP private
3. **Token Management**: Saat ini semua model pakai token yang sama, pertimbangkan per-model token untuk security lebih baik

## Access Control & Validation

### STRICT MODE for NON-ULTRA Users

NON-ULTRA users hanya bisa menggunakan model yang terdaftar di database. Validasi dilakukan dengan urutan:

1. **Model Existence Check** (NEW)
   - Model ID harus ada di database
   - Jika tidak ada: `404 - Model not found or not available`
   - ULTRA users bypass check ini (bisa pakai model apapun)

2. **Status Check**
   - Model status harus `active`
   - Status `suspend`: Model temporarily offline
   - Status `hidden`: Model tidak visible untuk non-ULTRA

3. **Restriction Check**
   - Jika `isRestricted: true`, email harus ada di whitelist
   - ULTRA users bypass restriction

4. **Private Model Check**
   - Model dengan format `email@domain.com/model-name`
   - Hanya owner yang bisa akses
   - ULTRA users bisa akses semua private models

### Error Responses

```json
// Model not in database (NON-ULTRA)
{
  "error": {
    "message": "Model 'gpt-xyz' not found or not available. Please check available models at /api/v1/ai/models",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}

// Model suspended
{
  "error": {
    "message": "Model 'gpt-4' is currently suspended.",
    "type": "access_denied",
    "code": 403
  }
}

// Restricted model
{
  "error": {
    "message": "Access to model 'gpt-4' is restricted to authorized users.",
    "type": "access_denied",
    "code": 403
  }
}
```

## Endpoint: List Models

### GET `/api/v1/ai/models`

Endpoint **PUBLIC** untuk mendapatkan list model yang tersedia. Tidak memerlukan authentication.

**Authentication:** ❌ Tidak diperlukan (Public endpoint)

**Response Format:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "created": 1776797528,
      "object": "model",
      "owned_by": "OpenAI",
      "context_length": 128000,
      "pricing": {
        "prompt": "0",
        "completion": "0"
      }
    }
  ]
}
```

**Filtering Logic:**

Endpoint ini hanya menampilkan model public:

- Status: `active` only
- `isRestricted: false` only
- Exclude private models (email-prefixed seperti `user@email.com/model`)

**Example Request:**

```bash
curl -X GET https://your-domain.com/api/v1/ai/models
```

## Future Enhancements

- [ ] Per-model API token (field `apiToken` di schema)
- [ ] Health check per upstream
- [ ] Automatic failover ke backup URL
- [ ] Rate limiting per baseUrl
- [ ] Metrics per upstream provider
- [ ] Extended model metadata (context_length, pricing dari DB)
