#!/bin/bash
# Comprehensive API endpoint testing script

echo "========================================="
echo "Titan Fleet API Endpoint Tests"
echo "========================================="
echo ""

BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    test_count=$((test_count + 1))
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $description (HTTP $response)"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} $description (Expected $expected_status, got $response)"
        fail_count=$((fail_count + 1))
    fi
}

echo "1. Health Check Endpoints"
echo "-------------------------"
test_endpoint "GET" "/health" "200" "Health check"
test_endpoint "GET" "/health/live" "200" "Liveness probe"
test_endpoint "GET" "/health/ready" "200" "Readiness probe"
echo ""

echo "2. Performance Monitoring Endpoints"
echo "-----------------------------------"
test_endpoint "GET" "/api/performance/stats" "200" "Performance stats"
test_endpoint "GET" "/api/performance/slow-queries" "200" "Slow queries"
echo ""

echo "3. Scheduler Endpoints"
echo "----------------------"
test_endpoint "GET" "/api/scheduler/status" "200" "Scheduler status"
echo ""

echo "4. Sentry Test Endpoint"
echo "-----------------------"
test_endpoint "GET" "/api/test-sentry" "500" "Sentry test error (expected 500)"
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Total tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
