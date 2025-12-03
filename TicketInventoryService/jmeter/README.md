# JMeter Load Test - Ticket Reservation Flow

## Overview

This JMeter test plan simulates a realistic ticket reservation workflow:
1. **Reserve tickets** → captures `reservationId`
2. **Think time** → realistic delay (1-3 seconds)
3. **Confirm reservation** → using the extracted `reservationId`

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Virtual Users | 50 |
| Ramp-up Time | 30 seconds |
| Loop Count | 100 per user |
| **Total Requests** | ~10,000 (5,000 reserve + 5,000 confirm) |
| Base URL | `http://localhost:8082` |

## Quick Start

### Option 1: Import the .jmx file

1. Open JMeter
2. File → Open → Select `TicketReservationLoadTest.jmx`
3. Click the green **Start** button (▶)

### Option 2: Run from command line (non-GUI mode - recommended for load tests)

```bash
# Navigate to JMeter bin directory
cd /path/to/apache-jmeter/bin

# Run the test
jmeter -n -t "path/to/TicketReservationLoadTest.jmx" -l results.jtl -e -o report/

# Parameters:
# -n : non-GUI mode
# -t : test plan file
# -l : log file for results
# -e : generate HTML report
# -o : output directory for HTML report
```

## Test Plan Structure

```
📁 Test Plan: Ticket Inventory - Reservation Flow Load Test
├── 📋 User Defined Variables
│   ├── BASE_URL = localhost
│   ├── PORT = 8082
│   └── EVENT_ID = 1
│
├── 👥 Thread Group (50 users, 30s ramp-up, 100 loops)
│   ├── 📝 HTTP Header Manager (Content-Type: application/json)
│   ├── 🌐 HTTP Request Defaults
│   ├── 🎲 Random User ID Generator (1-100000)
│   ├── 🎲 Random Quantity Generator (1-2)
│   │
│   ├── 📦 Transaction Controller: Complete Reservation Flow
│   │   ├── 🔄 POST /tickets/reserve
│   │   │   ├── JSON Extractor → reservationId
│   │   │   ├── Response Assertion (HTTP 2xx)
│   │   │   └── JSON Assertion (status = PENDING)
│   │   │
│   │   ├── ⏱️ Gaussian Random Timer (1-3 seconds)
│   │   │
│   │   └── 🔀 If Controller (reservationId exists)
│   │       └── 🔄 POST /tickets/confirm
│   │           ├── Response Assertion (HTTP 2xx)
│   │           └── JSON Assertion (status = CONFIRMED)
│   │
│   ├── ⏱️ Constant Timer (500ms between iterations)
│   │
│   └── 📊 Listeners
│       ├── View Results Tree (disabled by default)
│       ├── Summary Report → summary_report.csv
│       ├── Aggregate Report → aggregate_report.csv
│       └── Response Time Graph
```

## API Endpoints Tested

### POST /tickets/reserve

**Request:**
```json
{
  "eventId": 1,
  "userId": 42,
  "quantity": 2
}
```

**Expected Response (HTTP 200):**
```json
{
  "reservationId": 123,
  "status": "PENDING",
  "holdExpiresAt": "2025-11-07T15:30:00Z"
}
```

### POST /tickets/confirm

**Request:**
```json
{
  "reservationId": 123
}
```

**Expected Response (HTTP 200):**
```json
{
  "status": "CONFIRMED"
}
```

## Customization

### Modify Test Parameters

Edit the **User Defined Variables** in the test plan:

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Server hostname | `localhost` |
| `PORT` | Server port | `8082` |
| `EVENT_ID` | Target event ID | `1` |

### Adjust Load Profile

In the **Thread Group**:

| Setting | Description | Current Value |
|---------|-------------|---------------|
| Number of Threads | Concurrent users | 50 |
| Ramp-Up Period | Time to start all users | 30 seconds |
| Loop Count | Iterations per user | 100 |

### Request Volume Calculator

| Users | Loops | Reserve Requests | Confirm Requests | Total |
|-------|-------|------------------|------------------|-------|
| 50 | 100 | 5,000 | 5,000 | 10,000 |
| 100 | 100 | 10,000 | 10,000 | 20,000 |
| 50 | 200 | 10,000 | 10,000 | 20,000 |

## Interpreting Results

### Key Metrics to Watch

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Error % | < 1% | 1-5% | > 5% |
| Avg Response Time | < 200ms | 200-500ms | > 500ms |
| 95th Percentile | < 500ms | 500ms-1s | > 1s |
| Throughput | Stable | Declining | Volatile |

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| High error rate on `/reserve` | Insufficient ticket inventory | Pre-seed more tickets |
| High error rate on `/confirm` | Reservation expiration | Reduce think time or increase hold duration |
| Timeout errors | Server overloaded | Reduce concurrent users |
| Connection refused | Service not running | Start TicketInventoryService on port 8082 |

## Pre-requisites

1. **Start the TicketInventoryService:**
   ```bash
   cd TicketInventoryService
   ./mvnw spring-boot:run
   ```

2. **Ensure sufficient inventory exists** for `eventId=1`:
   - The test will attempt ~5,000 reservations
   - Each reservation is for 1-2 tickets
   - Estimated ticket demand: ~7,500 tickets

3. **Create event with inventory** (if needed):
   ```bash
   # Check availability
   curl http://localhost:8082/tickets/availability/1
   
   # You may need to seed the database with sufficient inventory
   ```

## Troubleshooting

### Debug Mode

Enable the **View Results Tree** listener to inspect individual requests:
1. Right-click on "View Results Tree"
2. Select "Enable"
3. Run a small test (reduce loop count to 1)
4. Inspect request/response pairs

### Validate Single Request

Test manually before load testing:

```bash
# Reserve
curl -X POST http://localhost:8082/tickets/reserve \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "userId": 42, "quantity": 2}'

# Confirm (replace 123 with actual reservationId)
curl -X POST http://localhost:8082/tickets/confirm \
  -H "Content-Type: application/json" \
  -d '{"reservationId": 123}'
```

## Advanced: Non-GUI Execution with Parameters

Override parameters from command line:

```bash
jmeter -n -t TicketReservationLoadTest.jmx \
  -JBASE_URL=api.example.com \
  -JPORT=443 \
  -JEVENT_ID=5 \
  -l results.jtl
```

Then modify the test plan to use: `${__P(BASE_URL,localhost)}`
