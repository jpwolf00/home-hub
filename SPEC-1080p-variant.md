# SPEC: Home Hub 1080p Variant (Port 3002)

## Goal
Add a second Home Hub runtime optimized for 1920x1080 displays while keeping:
- same content
- same 4-column organization
- same data sources/APIs

Keep existing 4K version running on port 3000.

## Approach
1. Add a runtime dashboard variant flag via environment variable:
   - `NEXT_PUBLIC_DASHBOARD_VARIANT=1080p` for 1080p service
   - default remains 4k behavior
2. Apply a root class (`dashboard-1080`) in `src/app/page.tsx` when variant is 1080p.
3. Add CSS overrides in `globals.css` to shrink typographic scale and ticker sizing for 1080p.
4. Add a second Docker Compose service:
   - `home-hub-1080` on `3002:3000`
   - set `NEXT_PUBLIC_DASHBOARD_VARIANT=1080p`
   - set `NEXT_PUBLIC_LOW_POWER=true` for Pi-friendly behavior

## Non-Goals
- No content changes
- No API changes
- No route changes

## Validation
- Build passes (`npm run build`)
- Compose config valid (`docker compose config`)
- Existing `home-hub` service still maps `3000:3000`
- New `home-hub-1080` service maps `3002:3000`
