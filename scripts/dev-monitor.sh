#!/bin/bash
# Continuous dev server health monitor
# Usage: ./scripts/dev-monitor.sh

LOG_DIR="/private/tmp/claude-501/-Users-duet-project-clickhouse-monitor/tasks"
DEV_SERVER_LOG="$LOG_DIR/bbb2fcc.output"
TS_LOG="$LOG_DIR/baecca4.output"
CHECK_INTERVAL=120  # Check every 2 minutes

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== DEV MONITOR STARTED ===${NC}"
echo -e "Check interval: ${CHECK_INTERVAL}s"
echo -e "Dev server log: $DEV_SERVER_LOG"
echo -e "TypeScript log: $TS_LOG"
echo ""

check_server_status() {
    if [ -f "$DEV_SERVER_LOG" ]; then
        if grep -q "Ready in" "$DEV_SERVER_LOG" 2>/dev/null; then
            if grep -q "exited with code 1" "$DEV_SERVER_LOG" 2>/dev/null; then
                echo "CRASHED"
            else
                echo "RUNNING"
            fi
        else
            echo "STARTING"
        fi
    else
        echo "NO_LOG"
    fi
}

count_errors() {
    local log_file="$1"
    local pattern="$2"
    if [ -f "$log_file" ]; then
        grep -c "$pattern" "$log_file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

get_latest_errors() {
    local log_file="$1"
    local pattern="$2"
    if [ -f "$log_file" ]; then
        grep "$pattern" "$log_file" 2>/dev/null | tail -3 || echo ""
    fi
}

print_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local server_status=$(check_server_status)
    local ts_errors=$(count_errors "$TS_LOG" "error TS")
    local runtime_errors=$(count_errors "$DEV_SERVER_LOG" "ERROR")
    local warnings=$(count_errors "$DEV_SERVER_LOG" "⚠\|Warning")

    echo -e "${BLUE}=== DEV MONITOR REPORT ===${NC}"
    echo -e "Time: $timestamp"
    echo -e "Server: ${GREEN}$server_status${NC}"
    echo -e "TS Errors: ${YELLOW}$ts_errors${NC}"
    echo -e "Runtime Errors: ${YELLOW}$runtime_errors${NC}"
    echo -e "Warnings: ${YELLOW}$warnings${NC}"

    # Show details if there are issues
    if [ "$server_status" = "CRASHED" ]; then
        echo -e "${RED}⚠ SERVER CRASHED!${NC}"
        echo -e "Latest errors:"
        tail -5 "$DEV_SERVER_LOG" 2>/dev/null | grep -E "(ERROR|error|exited)"
    fi

    if [ "$ts_errors" -gt "0" ]; then
        echo -e "${RED}⚠ TypeScript errors detected:${NC}"
        get_latest_errors "$TS_LOG" "error TS" | head -3
    fi

    if [ "$runtime_errors" -gt "0" ]; then
        echo -e "${RED}⚠ Runtime errors detected:${NC}"
        get_latest_errors "$DEV_SERVER_LOG" "ERROR" | head -3
    fi

    echo ""
}

# Initial report
print_report

# Continuous monitoring loop
while true; do
    sleep $CHECK_INTERVAL
    print_report
done
