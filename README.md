# Devora - Developer Operations & Resource Aggregator

Modern all-in-one developer platform untuk mengelola berbagai layanan dan tools dalam satu dashboard yang powerful dan user-friendly.

## 🚀 Features

### Core Features

- ✅ **Multi-User System** - Role-based access control (MEMBER, INSIDER, PRO, ULTRA)
- ✅ **API Key Management** - Generate dan kelola API keys dengan rate limiting
- ✅ **AI Model Proxy** - Unified interface untuk berbagai AI providers
- ✅ **Temp Mail Service** - Temporary email management
- ✅ **Gmail Integration** - Gmail account monitoring dan management
- ✅ **Google Drive Explorer** - Browse dan manage Google Drive files
- ✅ **Airdrop Tracker** - Track crypto airdrops dan tasks
- ✅ **Quick Vault** - Secure storage untuk credentials dan notes
- ✅ **App Library** - APK management dan distribution

### Advanced Features

- 🔐 **Rate Limiting** - Per-user rate limits (RPM, RPD, Max Tokens)
- 📊 **Usage Analytics** - Comprehensive API usage statistics
- 🎯 **Admin Dashboard** - ULTRA users get full system insights
- 🔄 **Real-time Updates** - Live data refresh dan monitoring
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Modern UI** - Dark theme dengan gradient effects

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MySQL dengan Prisma ORM
- **Authentication**: Custom JWT-based auth
- **Styling**: Tailwind CSS
- **Documentation**: Fumadocs
- **APIs**: Gmail API, Google Drive API, Various AI APIs

## 📋 Prerequisites

- Node.js 18+
- MySQL 8+
- npm atau yarn

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/devora.git
cd devora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` ke `.env` dan isi dengan credentials Anda:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/devora"

# AI Proxy Configuration (Optional - untuk AI features)
AI_PROXY_URL=http://localhost:8317
AI_PROXY_TOKEN=your_token_here

# Additional proxy presets (Optional)
ROUTER_PROXY_URL=http://your-router-proxy:port
ROUTER_PROXY_TOKEN=your_router_token

CPA_PROXY_URL=http://your-cpa-proxy:port
CPA_PROXY_TOKEN=your_cpa_token
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npm run db:update
# atau
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Project Structure

```
devora/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (main)/       # Main application pages
│   │   ├── (docs)/       # Documentation pages
│   │   ├── (landing)/    # Landing page
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   └── constants/        # Constants dan configurations
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── content/
│   └── docs/             # Documentation content (MDX)
├── public/               # Static assets
└── tests/                # Test files
```

## 🔑 API Key Management

### Generating API Keys

1. Login ke dashboard
2. Navigate ke `/api-key`
3. Click "New Key" button
4. Berikan nama untuk key Anda
5. (ULTRA users) Pilih access mode: Standard atau Full Access

### Using API Keys

Include API key di request header:

```bash
curl -H "Authorization: Bearer devora_your_api_key_here" \
  https://your-domain.com/api/v1/endpoint
```

### Rate Limits

Default rate limits per role:

- **MEMBER**: 25 RPM, 1000 RPD
- **INSIDER**: 50 RPM, 2000 RPD
- **PRO**: 100 RPM, 5000 RPD
- **ULTRA**: Unlimited

ULTRA users dapat mengkonfigurasi rate limits untuk semua roles via dashboard.

## 📊 Features Overview

### 1. AI Model Management

- Manage multiple AI model providers
- Configure model status dan restrictions
- Track token usage per model
- Role-based model access control

### 2. Temp Mail Service

- Create temporary email accounts
- Receive dan read messages
- Multiple provider support
- Auto-cleanup old messages

### 3. Gmail Center

- Connect multiple Gmail accounts via OAuth
- Monitor inbox statistics
- Auto-activity untuk keep accounts active
- Drive file explorer integration

### 4. Airdrop Tracker

- Track crypto airdrops
- Manage tasks dan progress
- Public/private airdrop listings
- Task completion tracking

### 5. Quick Vault

- Secure credential storage
- Categorized items (API Keys, Passwords, Notes, etc.)
- Encrypted storage
- Quick access interface

## 🔒 Security

### Best Practices

1. **Environment Variables**: Jangan commit file `.env` ke repository
2. **API Keys**: Rotate API keys secara berkala
3. **Database**: Gunakan strong passwords dan restrict access
4. **HTTPS**: Selalu gunakan HTTPS di production
5. **Rate Limiting**: Configure rate limits sesuai kebutuhan

### Files to Keep Private

Pastikan files berikut ada di `.gitignore`:

- `.env`
- `.env.local`
- `.env.*.local`
- `prisma/seed.js` (jika berisi data sensitif)
- `/config` directory

## 🚀 Deployment

### Production Checklist

- [ ] Set semua environment variables di production
- [ ] Run database migrations
- [ ] Configure HTTPS/SSL
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring dan logging
- [ ] Review security settings

### Recommended Platforms

- **Vercel** - Recommended untuk Next.js
- **Railway** - Good untuk full-stack apps
- **DigitalOcean** - VPS option
- **AWS/GCP** - Enterprise scale

## 📖 Documentation

Full documentation tersedia di `/docs` route setelah aplikasi running, atau visit:

- API References
- Feature Guides
- Setup Instructions
- Troubleshooting

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**

```bash
# Check DATABASE_URL format
# Ensure MySQL is running
# Verify credentials
```

**Prisma Client Error**

```bash
# Regenerate Prisma Client
npx prisma generate
```

**Build Errors**

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📞 Support

- 📧 Email: support@devora.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/devora/issues)
- 📖 Docs: [Documentation](http://localhost:3000/docs)

---

**Version**: 2.0.0  
**Last Updated**: May 2026  
**Built with**: ❤️ by the Devora Team
