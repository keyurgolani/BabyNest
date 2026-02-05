# BabyNest Database Migration Guide

This guide explains how to manage database migrations for BabyNest using Prisma.

**Requirements: 17.5** - Database migration system with data preservation

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Migration Commands](#migration-commands)
- [Data Preservation](#data-preservation)
- [Rollback Strategies](#rollback-strategies)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

BabyNest uses [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) for database schema management. Migrations are:

- **Version controlled**: All migrations are stored in `prisma/migrations/`
- **Incremental**: Each migration builds on the previous state
- **Safe**: Production deployments use `migrate deploy` which only applies pending migrations
- **Reversible**: Backup strategies ensure data can be recovered

## Quick Reference

| Task                      | Command                         |
| ------------------------- | ------------------------------- |
| Create migration (dev)    | `npm run prisma:migrate`        |
| Create migration only     | `npm run prisma:migrate:create` |
| Apply migrations (prod)   | `npm run prisma:migrate:prod`   |
| Check migration status    | `npm run prisma:migrate:status` |
| Reset database (dev only) | `npm run prisma:migrate:reset`  |
| View database             | `npm run prisma:studio`         |
| Seed database             | `npm run prisma:seed`           |

## Development Workflow

### 1. Making Schema Changes

Edit `prisma/schema.prisma` to add or modify your data models:

```prisma
model NewFeature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  @@map("new_features")
}
```

### 2. Creating a Migration

```bash
# Navigate to the API directory
cd apps/api

# Create and apply migration (interactive - will prompt for name)
npm run prisma:migrate

# Or create migration without applying (for review)
npm run prisma:migrate:create -- --name add_new_feature
```

### 3. Review the Migration

Check the generated SQL in `prisma/migrations/[timestamp]_[name]/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "new_features" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "new_features_pkey" PRIMARY KEY ("id")
);
```

### 4. Apply the Migration

```bash
# Apply pending migrations to development database
npm run prisma:migrate
```

### 5. Generate Prisma Client

After migrations, regenerate the Prisma client:

```bash
npm run prisma:generate
```

## Production Deployment

### Automatic Migrations (Recommended)

When using Docker, migrations run automatically on container startup via the entrypoint script:

```bash
# Start services - migrations run automatically
docker-compose up -d
```

To disable automatic migrations:

```yaml
# docker-compose.yml
services:
  api:
    environment:
      RUN_MIGRATIONS: 'false'
```

### Manual Migrations

For manual control over production migrations:

```bash
# Check pending migrations
docker-compose exec api npx prisma migrate status

# Apply pending migrations
docker-compose exec api npx prisma migrate deploy --config=prisma.config.ts

# Or from host with DATABASE_URL set
npm run prisma:migrate:prod
```

### CI/CD Pipeline

The GitHub Actions workflow automatically runs migrations during CI:

```yaml
- name: Run database migrations
  run: npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma --config=apps/api/prisma.config.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Migration Commands

### `prisma migrate dev`

**Use in**: Development only

Creates a new migration, applies it, and regenerates Prisma Client.

```bash
npm run prisma:migrate
# or with a specific name
npm run prisma:migrate -- --name add_user_preferences
```

### `prisma migrate deploy`

**Use in**: Production, CI/CD

Applies all pending migrations. Safe for production - never modifies existing migrations.

```bash
npm run prisma:migrate:prod
```

### `prisma migrate status`

Shows the status of all migrations.

```bash
npm run prisma:migrate:status
```

Output example:

```
3 migrations found in prisma/migrations

Status    Name
✅        20240101000000_initial
✅        20240115120000_add_preferences
⏳        20240201090000_add_notifications (pending)
```

### `prisma migrate reset`

**Use in**: Development only (DESTRUCTIVE)

Drops the database, recreates it, applies all migrations, and runs seed.

```bash
npm run prisma:migrate:reset
```

### `prisma migrate diff`

Compare schema states and generate SQL diff.

```bash
# Compare current schema to database
npm run prisma:migrate:diff -- --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```

## Data Preservation

### Before Migrations

**Always backup before production migrations:**

```bash
# Using Docker
docker-compose exec postgres pg_dump -U babynest babynest > backup_$(date +%Y%m%d_%H%M%S).sql

# Using npm script (requires DATABASE_URL)
npm run db:backup
```

### Migration Safety Rules

1. **Never delete columns in production** - Mark as deprecated first
2. **Add columns as nullable** - Then backfill data, then add constraints
3. **Use transactions** - Prisma wraps migrations in transactions by default
4. **Test migrations** - Run against a copy of production data first

### Safe Column Removal Pattern

```prisma
// Step 1: Add new column (nullable)
model User {
  oldField String?  @map("old_field")  // deprecated
  newField String?  @map("new_field")
}

// Step 2: Migrate data (in application code or SQL)
// UPDATE users SET new_field = old_field WHERE new_field IS NULL;

// Step 3: Make new column required, remove old
model User {
  newField String @map("new_field")
}
```

### Safe Table Rename Pattern

```sql
-- Migration 1: Create new table
CREATE TABLE "new_table_name" AS SELECT * FROM "old_table_name";

-- Migration 2: Update foreign keys and application code

-- Migration 3: Drop old table (after verification)
DROP TABLE "old_table_name";
```

## Rollback Strategies

Prisma doesn't have built-in rollback. Use these strategies:

### Strategy 1: Restore from Backup

```bash
# Restore PostgreSQL backup
docker-compose exec -T postgres psql -U babynest babynest < backup.sql
```

### Strategy 2: Manual Rollback Migration

Create a new migration that reverses the changes:

```bash
npm run prisma:migrate:create -- --name rollback_feature_x
```

Then edit the generated SQL to reverse the changes.

### Strategy 3: Point-in-Time Recovery

For critical production systems, use PostgreSQL's point-in-time recovery with WAL archiving.

## Troubleshooting

### Migration Drift

If the database schema doesn't match migrations:

```bash
# Check for drift
npm run prisma:migrate:status

# In development, reset the database
npm run prisma:migrate:reset

# In production, create a baseline migration
npx prisma migrate resolve --applied "20240101000000_initial"
```

### Failed Migration

If a migration fails partway:

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20240201090000_failed_migration"

# Fix the migration SQL, then reapply
npm run prisma:migrate:prod
```

### Shadow Database Issues

Prisma uses a shadow database for development. If you see errors:

```bash
# Ensure you have permissions to create databases
# Or specify a shadow database URL
DATABASE_URL="..." SHADOW_DATABASE_URL="..." npm run prisma:migrate
```

### Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check DATABASE_URL format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

## Best Practices

### 1. Naming Conventions

Use descriptive migration names:

- ✅ `add_user_preferences`
- ✅ `create_notifications_table`
- ✅ `add_index_on_baby_id`
- ❌ `update`
- ❌ `fix`

### 2. Small, Focused Migrations

Each migration should do one thing:

- ✅ Add a single table
- ✅ Add a single column
- ✅ Add an index
- ❌ Restructure entire schema

### 3. Review Generated SQL

Always review the generated SQL before applying:

```bash
# Create without applying
npm run prisma:migrate:create -- --name my_migration

# Review the SQL
cat prisma/migrations/*/migration.sql

# Apply if correct
npm run prisma:migrate:prod
```

### 4. Test with Production Data

Before production deployment:

```bash
# Create a copy of production database
pg_dump production_db > prod_backup.sql
psql test_db < prod_backup.sql

# Test migrations against copy
DATABASE_URL="test_db_url" npm run prisma:migrate:prod
```

### 5. Version Control

- ✅ Commit all migration files
- ✅ Never modify applied migrations
- ✅ Include `migration_lock.toml`
- ❌ Don't gitignore migrations

### 6. Environment Separation

```bash
# Development
DATABASE_URL="postgresql://dev:dev@localhost:5432/babynest_dev"

# Testing
DATABASE_URL="postgresql://test:test@localhost:5432/babynest_test"

# Production
DATABASE_URL="postgresql://prod:secure@prod-host:5432/babynest"
```

## Migration File Structure

```
prisma/
├── schema.prisma           # Current schema definition
├── seed.ts                 # Database seeding script
├── MIGRATIONS.md           # This documentation
└── migrations/
    ├── migration_lock.toml # Provider lock file
    ├── 20240101000000_initial/
    │   └── migration.sql   # Initial schema
    └── 20240115120000_add_feature/
        └── migration.sql   # Feature migration
```

## Related Documentation

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- [BabyNest Docker Deployment](../../../docker/README.md)
