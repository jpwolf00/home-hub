# Feature Kanban Board - SPEC.md

## Overview
Track features and agent tasks with a simple Kanban board. Shows planned, in-progress, and completed items with live agent stats.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FEATURE KANBAN                                                [+ New Feature]  │
├──────────────────┬──────────────────┬──────────────────┬─────────────────────┤
│     PLANNED      │   IN PROGRESS    │     COMPLETED    │      ON HOLD        │
├──────────────────┼──────────────────┼──────────────────┼─────────────────────┤
│                  │ ┌──────────────┐ │ ┌──────────────┐ │                     │
│  ┌────────────┐  │ │ Server Page  │ │ │ Beszel Agent │ │  ┌────────────┐    │
│  │ Personal   │  │ │              │ │ │ Install      │ │  │ Token      │    │
│  │ Dashboard  │  │ │ Agent: impl  │ │ │              │ │  │ Widget     │    │
│  └────────────┘  │ │ Tokens: 12k │ │ │ Agent: arch │ │  └────────────┘    │
│                  │ │ Last: 2m ago │ │ │ Completed    │ │                     │
│  ┌────────────┐  │ └──────────────┘ │ │ 3:45pm      │ │                     │
│  │ AI News    │  │                  │ └──────────────┘ │                     │
│  │ Aggregator │  │ ┌──────────────┐ │                  │                     │
│  └────────────┘  │ │ Personal     │ │                  │                     │
│                  │ │ Dashboard    │ │                  │                     │
│                  │ │ Agent: impl  │ │                  │                     │
│                  │ │ Tokens: 8k   │ │                  │                     │
│                  │ │ Last: 5m ago │ │                  │                     │
│                  │ └──────────────┘ │                  │                     │
└──────────────────┴──────────────────┴──────────────────┴─────────────────────┘
```

---

## Data Model

```ts
type Feature = {
  id: string
  title: string
  description?: string
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold'
  createdAt: string
  updatedAt: string
  
  // For in_progress items
  agentId?: string
  agentName?: string
  tokensIn?: number
  tokensOut?: number
  lastPromptAt?: string
  
  // For completed items
  completedAt?: string
}
```

---

## API Endpoints

### GET /api/kanban
Returns all features grouped by status.

### POST /api/kanban
Create new feature.

### PATCH /api/kanban/[id]
Update feature status or details.

### DELETE /api/kanban/[id]
Delete feature.

---

## Components

### KanbanBoard
- 4 columns: Planned, In Progress, Completed, On Hold
- Drag-and-drop between columns (or click to move)
- Auto-refresh every 30s to update agent stats

### FeatureCard
- Title + optional description
- Status indicator (colored border)
- For IN PROGRESS:
  - Agent name + avatar
  - Token in/out (e.g., "12.5k / 0.8k")
  - Last prompt timestamp (e.g., "Last: 2m ago")

### NewFeatureForm
- Simple input: title + optional description
- Defaults to "planned" status

---

## Live Agent Data

For "in_progress" features with agentId:
1. Call `sessions_list` to get active sessions
2. Filter by agentId
3. Extract: model, totalTokens, updatedAt
4. Display in FeatureCard

---

## Visual Design

### Colors
- Planned: border-gray-400
- In Progress: border-blue-500, bg-blue-500/10
- Completed: border-green-500, bg-green-500/10
- On Hold: border-yellow-500, bg-yellow-500/10

### Typography
- Column headers: 14px uppercase, bold
- Feature titles: 14px semibold
- Meta info: 12px, muted

---

## Interactions

- Click "+" to add new feature
- Click feature to edit/move
- Auto-refresh: every 30 seconds
- Manual refresh button in header
