#!/bin/bash

# Quick Load Test Script
# Runs Artillery load test and generates HTML report

set -e

echo "🚀 Titan Fleet - Load Testing"
echo "================================"
echo ""

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo "❌ Artillery not found. Installing..."
    npm install -g artillery@latest
    echo "✅ Artillery installed"
fi

# Check if server is running
echo "Checking if server is running..."
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Server is not running at http://localhost:3000"
    echo "Please start the server first:"
    echo "  npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create reports directory
mkdir -p reports

# Generate timestamp for report
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_JSON="reports/load-test_${TIMESTAMP}.json"
REPORT_HTML="reports/load-test_${TIMESTAMP}.html"

echo "📊 Running load test..."
echo "This will take approximately 5 minutes"
echo ""

# Run the load test
artillery run --output "$REPORT_JSON" load-test.yml

echo ""
echo "📈 Generating HTML report..."

# Generate HTML report
artillery report "$REPORT_JSON" --output "$REPORT_HTML"

echo ""
echo "✅ Load Test Complete!"
echo "================================"
echo ""
echo "📊 Reports generated:"
echo "   JSON: $REPORT_JSON"
echo "   HTML: $REPORT_HTML"
echo ""
echo "📈 View report:"
echo "   open $REPORT_HTML"
echo ""

# Display summary from JSON
echo "📋 Quick Summary:"
echo "--------------------------------"

# Extract key metrics using jq if available
if command -v jq &> /dev/null; then
    echo "Total scenarios: $(jq '.aggregate.scenariosCreated' "$REPORT_JSON")"
    echo "Completed: $(jq '.aggregate.scenariosCompleted' "$REPORT_JSON")"
    echo "Requests: $(jq '.aggregate.requestsCompleted' "$REPORT_JSON")"
    echo "Median response time: $(jq '.aggregate.latency.median' "$REPORT_JSON")ms"
    echo "P95 response time: $(jq '.aggregate.latency.p95' "$REPORT_JSON")ms"
    echo "P99 response time: $(jq '.aggregate.latency.p99' "$REPORT_JSON")ms"
    
    # Calculate success rate
    CREATED=$(jq '.aggregate.scenariosCreated' "$REPORT_JSON")
    COMPLETED=$(jq '.aggregate.scenariosCompleted' "$REPORT_JSON")
    SUCCESS_RATE=$(echo "scale=2; $COMPLETED * 100 / $CREATED" | bc)
    echo "Success rate: ${SUCCESS_RATE}%"
    
    echo ""
    
    # Check if thresholds are met
    P95=$(jq '.aggregate.latency.p95' "$REPORT_JSON")
    P99=$(jq '.aggregate.latency.p99' "$REPORT_JSON")
    
    if (( $(echo "$SUCCESS_RATE >= 99" | bc -l) )) && \
       (( $(echo "$P95 <= 1000" | bc -l) )) && \
       (( $(echo "$P99 <= 2000" | bc -l) )); then
        echo "✅ All performance thresholds met!"
        echo "   - Success rate: ≥99% ✅"
        echo "   - P95: ≤1000ms ✅"
        echo "   - P99: ≤2000ms ✅"
    else
        echo "⚠️  Some performance thresholds not met:"
        if (( $(echo "$SUCCESS_RATE < 99" | bc -l) )); then
            echo "   - Success rate: ${SUCCESS_RATE}% (target: ≥99%) ❌"
        fi
        if (( $(echo "$P95 > 1000" | bc -l) )); then
            echo "   - P95: ${P95}ms (target: ≤1000ms) ❌"
        fi
        if (( $(echo "$P99 > 2000" | bc -l) )); then
            echo "   - P99: ${P99}ms (target: ≤2000ms) ❌"
        fi
    fi
else
    echo "Install 'jq' for detailed metrics: npm install -g jq"
    echo "Or view the HTML report for full details"
fi

echo ""
echo "📚 Next steps:"
echo "   1. Open HTML report: open $REPORT_HTML"
echo "   2. Check slow queries: curl http://localhost:3000/api/performance/slow-queries"
echo "   3. Review performance stats: curl http://localhost:3000/api/performance/stats"
echo ""
