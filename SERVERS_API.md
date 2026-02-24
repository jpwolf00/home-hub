# Home Hub Server API Documentation

## Overview
Server monitoring API endpoints for Home Hub v2. Integrates with Beszel for system metrics.

## Base URL
`/api/servers`

---

## GET /api/servers

Returns list of all monitored servers with current metrics.

### Response
```json
{
  "servers": [
    {
      "id": "abc123",
      "name": "UNRAID",
      "status": "online",
      "cpu": 45,
      "memory": 78,
      "disk": 18
    }
  ],
  "isStale": false,
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "usingFallback": false
}
```

### Fields
- `servers` (array): List of server objects
- `isStale` (boolean): True if metric data is older than 2 minutes
- `lastUpdated` (string): ISO timestamp of last data fetch
- `usingFallback` (boolean): True if Beszel is unreachable and mock data is returned

---

## GET /api/servers/[id]

Returns detailed information for a single server including metric history.

### Parameters
- `id` (path): Server ID from Beszel

### Response
```json
{
  "server": {
    "id": "abc123",
    "name": "UNRAID",
    "status": "online",
    "cpu": 45,
    "memory": 78,
    "disk": 18,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "history": {
    "cpu": [40, 42, 45, 43, 45],
    "memory": [76, 77, 78, 78, 78],
    "disk": [18, 18, 18, 18, 18]
  },
  "isStale": false
}
```

### Notes
- History contains up to 60 samples (1 hour at 1 sample/minute)
- Returns empty arrays if no history recorded yet

---

## POST /api/servers/metrics

Saves metric samples for all servers. Intended for cron job (every minute).

### Request Body
```json
{
  "servers": [
    {
      "id": "abc123",
      "cpu": 45,
      "memory": 78,
      "disk": 18
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "saved": 4,
  "failed": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Notes
- Requires `serverId`, `cpu`, `memory`, `disk` for each server
- Uses Prisma SQLite for storage
- Gracefully handles database errors (table may not exist on first run)

---

## GET /api/servers/metrics

Retrieves historical metrics for a specific server.

### Query Parameters
- `serverId` (required): Server ID
- `limit` (optional): Number of samples (default 60, max 1440)

### Response
```json
{
  "serverId": "abc123",
  "count": 60,
  "metrics": [
    {
      "id": "metric123",
      "serverId": "abc123",
      "cpu": 45,
      "memory": 78,
      "disk": 18,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Stale Data Detection

Data is marked as stale when:
- Last saved metric is older than 2 minutes
- Beszel API is unreachable (using fallback data)

Display "⚠ Stale Data" badge in UI when `isStale: true`.

---

## Error Handling

All endpoints return:
- `200` on success
- `400` for invalid requests
- `404` for not found
- `500` for server errors

Error responses include `{ "error": "message" }` body.

---

## Dependencies

- **Beszel** (http://192.168.85.199:8090): Primary metrics source
- **Prisma SQLite**: Local metric storage
- Fallback mock data when Beszel is unreachable
