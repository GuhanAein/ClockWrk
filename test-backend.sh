#!/bin/bash

BACKEND_URL="https://clockwrk-production-1454.up.railway.app"

echo "🔍 Testing ClockWrk Backend"
echo "============================"
echo ""

# Health check
echo "1. Health Endpoint Test:"
echo "   URL: $BACKEND_URL/api/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
echo "   Status Code: $STATUS"

if [ "$STATUS" = "200" ]; then
    echo "   ✅ Backend is UP!"
    echo ""
    echo "   Response:"
    curl -s "$BACKEND_URL/api/health" | python3 -m json.tool 2>/dev/null || curl -s "$BACKEND_URL/api/health"
else
    echo "   ❌ Backend is DOWN (Status: $STATUS)"
    echo ""
    echo "   Full Response:"
    curl -s "$BACKEND_URL/api/health"
fi

echo ""
echo "============================"
echo ""
echo "2. Root Endpoint Test:"
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/")
echo "   Status Code: $ROOT_STATUS"

echo ""
echo "📋 Next Steps:"
echo "   - If status is 502, check Railway logs"
echo "   - Verify environment variables are set correctly"
echo "   - Check if the application container is deployed"
