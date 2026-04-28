# Prisma Schema Rules & Guidelines

## ⚠️ CRITICAL RULES - READ BEFORE ANY SCHEMA CHANGES

### 1. **NEVER Modify Schema Without Explicit Permission**

- **DO NOT** add, remove, or modify any fields in existing models
- **DO NOT** create new models without explicit user request
- **DO NOT** change field types, constraints, or relationships
- **ALWAYS** ask user first before making ANY schema changes
- **ONLY edit `prisma/schema.prisma` after explicit approval**; the user must run migrations themselves
- **NEVER run Prisma migration commands** such as `prisma migrate dev`, `prisma migrate deploy`, `npm run db:update`, or any command that creates/applies migrations
- **NEVER create, edit, delete, move, or rename anything inside `prisma/migrations/`**

### 2. **Before Making Schema Changes - CHECKLIST**

- [ ] User explicitly requested the schema change
- [ ] Discussed the impact on existing data
- [ ] Confirmed there's no alternative solution (e.g., using existing models like GlobalConfig)
- [ ] User approved the migration plan
- [ ] Backup plan discussed in case of issues

### 3. **Migration Best Practices**

```bash
# CORRECT workflow for agents:
1. Modify prisma/schema.prisma (only after approval)
2. Tell the user to run the migration locally themselves
3. NEVER run: npm run db:update, prisma migrate dev, prisma migrate deploy, or any migration command
4. NEVER use: npx prisma db push
5. NEVER use: npx prisma migrate reset
6. NEVER CRUD files inside prisma/migrations/
```

### 4. **Common Mistakes to AVOID**

❌ Adding fields to User model when GlobalConfig exists
❌ Running `prisma migrate reset` without backup
❌ Running any Prisma migration command as the agent
❌ Using `db push` instead of proper migrations
❌ Creating/editing/deleting files inside `prisma/migrations/`
❌ Creating new models when existing ones can be used
❌ Modifying schema without understanding data impact

### 5. **Alternative Solutions - Check First**

Before adding fields to models, consider:

#### For Global Settings/Credentials:

✅ Use **GlobalConfig** model (key-value pairs)

- Perfect for: API keys, tokens, system-wide settings
- Managed by: ULTRA users via /config page
- Example: GROQ_API_KEY, TELEGRAM_BOT_TOKEN

#### For User-Specific Data:

✅ Check if existing JSON fields can be used

- User.httpClientData (LongText)
- User.telkomselData (LongText)
- Can store structured JSON data

#### For Feature Flags:

✅ Use **MaintenanceConfig** model

- Can be repurposed for feature toggles
- Already has enabled/disabled logic

### 6. **When Schema Change IS Necessary**

If you must change schema:

1. **Discuss with user:**
   - Why this change is needed
   - What alternatives were considered
   - Impact on existing data
   - Migration strategy

2. **Tell the user to create/apply migration themselves:**

   ```bash
   npm run db:update
   # or
   npx prisma migrate dev --name descriptive_name
   ```

   Agents must not run these commands. Provide them as instructions only.

3. **Update related code:**
   - API routes that use the model
   - Frontend components
   - Seed files if needed

4. **Test thoroughly:**
   - Check existing data compatibility
   - Test new functionality
   - Verify no breaking changes

### 7. **Emergency Rollback**

If migration causes issues:

```bash
# DO NOT use migrate reset unless user approves
# Instead, create a new migration to revert changes
npx prisma migrate dev --name revert_previous_change
```

Agents must not run this command. The user must handle rollback migrations themselves.

### 8. **Documentation Requirements**

When schema is changed:

- Update this file with the change reason
- Document in migration file comments
- Update API documentation if needed

---

## 📝 Schema Change History

### 2026-04-18: Telegram Credentials (REVERTED)

- **Attempted:** Added groqApiKey, telegramBotToken, telegramChannelId to User model
- **Issue:** Wrong approach - should use GlobalConfig instead
- **Resolution:** Reverted changes, used GlobalConfig for global credentials
- **Lesson:** Always check if GlobalConfig can be used for system-wide settings

---

## 🎯 Quick Decision Tree

```
Need to store data?
│
├─ Is it system-wide/global setting?
│  └─ YES → Use GlobalConfig (key-value)
│
├─ Is it user-specific but flexible?
│  └─ YES → Check existing JSON fields (httpClientData, etc.)
│
├─ Is it a feature toggle?
│  └─ YES → Use MaintenanceConfig
│
└─ None of above work?
   └─ ASK USER before creating new fields/models
```

---

## 📚 Existing Models Reference

### GlobalConfig

- Purpose: System-wide key-value configuration
- Access: ULTRA users only
- UI: /config page
- Use for: API keys, tokens, global settings

### User

- Has JSON fields: httpClientData, telkomselData
- Has credentials: googleClientId, googleClientSecret
- Avoid adding more fields unless absolutely necessary

### MaintenanceConfig

- Purpose: Feature maintenance toggles
- Can be repurposed for feature flags
- Has: enabled, message, icon, color

---

**Remember:** The best schema change is the one you don't make. Always look for existing solutions first!
