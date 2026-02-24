# Mission Control (MVP)

Standalone read-only Mission Control app for Home Hub.

## Run locally

```bash
cd /home/jpwolf00/.openclaw/workspace/home-hub/mission-control
npm install
mkdir -p data/mission-control/snapshots data/mission-control/cache
cp data/sample-openclaw-snapshot.json data/mission-control/snapshots/openclaw-snapshot.json
npm run build
PORT=3001 npm run start
```

Mission Control: `http://localhost:3001`

Existing Home Hub remains separate on port 3000.

## API Endpoints

- `GET /api/workflows`
- `GET /api/agents`
- `GET /api/activity`
- `GET /api/health`

## Key env vars

```bash
PORT=3001
MISSION_CONTROL_PORT=3001
MC_DATA_DIR=/app/data/mission-control
MC_DB_PATH=/app/data/mission-control/mission-control.db
MC_SNAPSHOT_PATH=/app/data/mission-control/snapshots/openclaw-snapshot.json
MC_DEPLOY_CACHE_PATH=/app/data/mission-control/cache/deploy-status.json
MC_POLL_MS=15000
MC_STALLED_MINUTES=10
MC_DEPLOY_POLL_MS=60000
MC_SNAPSHOT_MAX_AGE_MS=120000
COOLIFY_BASE_URL=http://192.168.85.202:8000
COOLIFY_TOKEN=<secret>
COOLIFY_APP_UUID=<optional>
```

## Coolify deploy (separate service on 3001)

1. Create a second Coolify app from same repo.
2. Base Directory: `mission-control`
3. Build: `npm ci && npm run build`
4. Start: `npm run start`
5. Port: `3001`
6. Attach persistent volume at `/app/data/mission-control`
7. Add env vars above
8. Health check path: `/api/health`
