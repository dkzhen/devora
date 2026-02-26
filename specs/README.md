# MailPulse Project Documentation

## 1. Project Overview
MailPulse is a modern dashboard for managing Gmail accounts via OAuth. It allows users to:
- Connect multiple Gmail accounts using OAuth.
- View real-time statistics (messages, threads).
- Fetch and store recent messages from connected accounts.
- Monitor API usage and system status.
- Manage access with role-based authentication (MEMBER, PRO, ULTRA).

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: MySQL (via Prisma ORM)
- **Styling**: TailwindCSS
- **Authentication**: JWT (Jose) + Cookies
- **Google API**: `googleapis` library

---

## 2. Database Schema

The database is managed using Prisma. The schema is defined in `prisma/schema.prisma`.

### Models

#### `User`
Stores application users (administrators/customers).
- `id`: UUID
- `email`: Unique email address
- `password`: Bcrypt hashed password
- `role`: Enum (`MEMBER`, `PRO`, `ULTRA`)
- `createdAt`, `updatedAt`: Timestamps

#### `Account`
Stores connected Gmail accounts.
- `email`: Primary Key (Gmail address)
- `name`: User's display name
- `refreshToken`: OAuth refresh token for offline access
- `status`: Account status (e.g., 'active', 'error')
- `totalMessages`, `totalThreads`: Cached stats
- `lastCheck`: Timestamp of last sync
- `messages`: Relation to `Message` model

#### `Message`
Stores recent emails fetched from Gmail.
- `id`: Gmail Message ID
- `subject`: Email subject
- `from`: Sender address
- `snippet`: Short preview
- `receivedAt`: Date received
- `accountId`: Foreign Key to `Account`

---

## 3. API Documentation

All API routes are located in `src/app/api`.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login with email/password. Returns HTTP-only cookie. | Public |
| `POST` | `/api/auth/logout` | Clears the auth cookie. | Authenticated |
| `GET` | `/api/auth/me` | Returns current user profile (ID, Name, Role). | Authenticated |
| `GET` | `/api/auth/google` | Initiates Google OAuth flow for adding accounts. | Authenticated |
| `GET` | `/api/auth/google/callback` | Handles OAuth callback, saves refresh token to DB. | Public |

### Accounts (`/api/accounts`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/accounts` | List all connected accounts. | Authenticated |
| `GET` | `/api/accounts/[email]` | Get details for a specific account. | Authenticated |
| `DELETE` | `/api/accounts/[email]` | Disconnect/Delete an account. | Authenticated |

### Messages (`/api/accounts/[email]/messages`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/accounts/[email]/messages` | Get stored messages for an account. | Authenticated |
| `POST` | `/api/accounts/[email]/messages` | Trigger sync: fetch fresh messages from Gmail & save to DB. | Authenticated |

### Monitoring (`/api/monitoring`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/monitoring` | Returns system stats (Total Accounts, Messages, Active Sessions). | Authenticated |

---

## 4. Maintenance Guide

### Prerequisites
- Node.js 18+
- MySQL Database

### Setup
1.  **Environment Variables**: Ensure `.env` is configured.
    ```env
    DATABASE_URL="mysql://user:pass@host:port/db_name"
    JWT_SECRET="your-secure-secret"
    GOOGLE_CLIENT_ID="..."
    GOOGLE_CLIENT_SECRET="..."
    GOOGLE_REDIRECT_URI="..."
    ```
2.  **Dependencies**: `npm install`
3.  **Database**:
    - Generate Client: `npx prisma generate`
    - Push Schema: `npx prisma db push`
    - Seed Admin: `node prisma/seed.js`

### Common Tasks

#### Updating Database Schema
1.  Modify `prisma/schema.prisma`.
2.  Run `npx prisma db push` to apply changes to the DB.
3.  Run `npx prisma generate` to update the client.
4.  **Restart the dev server** (`npm run dev`) to load the new client.

#### Adding a New Feature
1.  Create API route in `src/app/api/your-feature/route.js`.
2.  Create UI component in `src/components`.
3.  Update `src/components/Sidebar.js` if navigation is needed.

#### Debugging
- **Prisma Client Issues**: If you see errors like `Unknown field`, restart the dev server.
- **Auth Issues**: Check `middleware.js` and cookie storage. use `/api/auth/me` to verify session.

### Debug Scripts
Located in `tests/` folder:
- `debug-db.js`: Test DB connection.
- `verify-role.js`: Check user roles.
- `check-stats.js`: verify DB statistics.

---

## 5. Folder Structure

```
├── prisma/
│   ├── schema.prisma    # Database Schema
│   └── seed.js          # Admin User Seeder
├── src/
│   ├── app/
│   │   ├── api/         # Backend API Routes
│   │   ├── login/       # Login Page
│   │   ├── email-list/  # Account Management
│   │   └── page.js      # Main Dashboard
│   ├── components/      # React Components (Sidebar, Charts, etc.)
│   ├── lib/
│   │   ├── db.js        # Prisma Client Instance
│   │   └── services/    # Business Logic (Gmail Service)
├── middleware.js        # Route Protection & Auth
└── tests/               # Maintenance Scripts
```
