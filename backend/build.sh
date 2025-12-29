#!/bin/bash
# Build script that sets Java 21 for Maven

# Set Java 21 (required for Lombok compatibility)
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Verify Java version
echo "Using Java: $JAVA_HOME"
java -version

# Run Maven with all arguments passed to this script
mvn "$@"

