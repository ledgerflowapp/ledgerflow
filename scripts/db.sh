#!/bin/bash

# Database Helper Script
# Usage: ./scripts/db.sh -e <env_file> <command>

set -e

# Parse arguments
ENV_FILE=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -e|--env) ENV_FILE="$2"; shift ;;
        generate|migrate|push|reset-db|reset-migrations|setup) COMMAND="$1" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$ENV_FILE" ]; then
    echo "Error: Environment file not specified. Use -e or --env."
    echo "Usage: ./scripts/db.sh -e <env_file> <command>"
    exit 1
fi

if [ -z "$COMMAND" ]; then
    echo "Error: Command not specified."
    echo "Usage: ./scripts/db.sh -e <env_file> <command>"
    echo "Commands:"
    echo "  generate         - Generate Better Auth schemas and Drizzle migrations"
    echo "  migrate          - Apply migrations to the database"
    echo "  push             - Push schema directly to the database without migrations"
    echo "  reset-db         - Drop the public schema and recreate it"
    echo "  reset-migrations - Delete all files in the ./drizzle output folder"
    echo "  setup            - Reset DB and push schemas (reset-db + push)"
    exit 1
fi

# Load the environment file and export its variables to extract DATABASE_URL
# using allexport to export all sourced variables
set -o allexport
source "$ENV_FILE"
set +o allexport

case $COMMAND in
    generate)
        echo "Generating Better Auth schemas..."
        npx dotenv -e "$ENV_FILE" -- npx @better-auth/cli generate
        echo "Generating Drizzle migrations..."
        npx dotenv -e "$ENV_FILE" -- npx drizzle-kit generate
        ;;
    migrate)
        echo "Applying Drizzle migrations..."
        npx dotenv -e "$ENV_FILE" -- npx drizzle-kit migrate
        ;;
    push)
        echo "Pushing schema directly via Drizzle..."
        npx dotenv -e "$ENV_FILE" -- npx drizzle-kit push
        ;;
    reset-db)
        echo "Resetting database by dropping public schema..."
        npx dotenv -e "$ENV_FILE" -- npx tsx scripts/drop-schema.ts
        echo "Database schema reset successful."
        ;;
    reset-migrations)
        echo "Deleting Drizzle migration folder..."
        rm -rf ./drizzle/*
        echo "Migration folder cleared."
        ;;
    setup)
        echo "Setting up database from scratch..."
        $0 -e "$ENV_FILE" reset-db
        $0 -e "$ENV_FILE" push
        ;;
esac
