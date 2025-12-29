#!/bin/bash
# Set Java 21 (required for Lombok compatibility)
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Java network options for IPv6 compatibility (Supabase uses IPv6)
export JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=false -Djava.net.preferIPv6Addresses=true"

# Load environment variables from .env.local (for local) or .env (for production)
ENV_FILE=".env.local"
if [ ! -f "$(dirname "$0")/$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

echo "📝 Loading environment from: $ENV_FILE"

set -a
source "$(dirname "$0")/$ENV_FILE"
set +a

# Run the application
./mvnw spring-boot:run
