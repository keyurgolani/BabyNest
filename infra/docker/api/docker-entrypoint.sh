#!/bin/sh
# BabyNest API Docker Entrypoint
# Handles database migrations and application startup
# Requirements: 17.5 - Database migration system with data preservation

set -e

echo "🍼 BabyNest API Starting..."

# Wait for database to be ready
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    # Using POSIX-compliant parsing
    DB_HOST_PORT=$(echo "$DATABASE_URL" | cut -d'@' -f2 | cut -d'/' -f1)
    DB_HOST=$(echo "$DB_HOST_PORT" | cut -d':' -f1)
    DB_PORT=$(echo "$DB_HOST_PORT" | cut -d':' -f2)
    
    # Default port if not specified or if parsing failed
    if [ -z "$DB_PORT" ] || [ "$DB_PORT" = "$DB_HOST" ]; then
        DB_PORT=5432
    fi
    
    echo "📡 Connecting to database at $DB_HOST:$DB_PORT"
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "⏳ Waiting for database... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done
    
    echo "❌ Database connection timeout after $MAX_RETRIES attempts"
    exit 1
}

# Run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    # Deploy migrations (safe for production - only applies pending migrations)
    if npx prisma migrate deploy; then
        echo "✅ Migrations completed successfully!"
    else
        echo "❌ Migration failed!"
        exit 1
    fi
}

# Generate Prisma client if needed
generate_prisma_client() {
    echo "🔧 Ensuring Prisma client is generated..."
    npx prisma generate
}

# Main execution
main() {
    # Only run migrations if RUN_MIGRATIONS is not explicitly set to "false"
    if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
        wait_for_db
        run_migrations
    else
        echo "⏭️  Skipping migrations (RUN_MIGRATIONS=false)"
    fi
    
    # Optionally run seed if SEED_DATABASE is set to "true"
    if [ "${SEED_DATABASE:-false}" = "true" ]; then
        echo "🌱 Seeding database..."
        npx prisma db seed || echo "⚠️  Seeding failed or already seeded"
    fi
    
    echo "🚀 Starting BabyNest API..."
    
    # Execute the main command (passed as arguments)
    exec "$@"
}

main "$@"
