# Mapomo team API — `/api/v1`

Base: `https://workspace-production-5979.up.railway.app/api/v1/` · Header: `Authorization: Bearer mpk_…`
JSON in and out. Locally, `server.mjs` exposes the same paths under `/field-api/…` (used by `web/`).

## Team
| Method | Path | Role |
|---|---|---|
| GET | `method` | Exact source of the valuation method the server runs, with its sha256 |
| GET | `me` | Team, daily limits, today's usage, current instructions |
| POST | `instructions` | `{text}` (≤ 4000 chars) — team instructions added to the agent |

## Agent (the loop runs on the server)
| Method | Path | Body | Role |
|---|---|---|---|
| POST | `agent/open` | `{case_id?}` | Opens the conversation (general or for a case) → `conversation_id` |
| POST | `agent/send` | `{conversation_id, text, request_id, attachments?}` | Sends a message (counts 1 "message") |
| POST | `agent/advance` | `{conversation_id, run_id}` | Moves the reply forward; repeat while `run.status` is `queued`/`running` |
| GET | `agent/history` | | Earlier conversations |

`request_id`: 8 to 100 characters `[A-Za-z0-9_-]`, unique per message (resending with the same ID creates no duplicate).

## Evidence
| Method | Path | Body | Role |
|---|---|---|---|
| GET | `state` | | Your reports and analyses; reference prices and parties (read-only) |
| POST | `upload` | `{country:'SN', synthetic:true, name, data:<base64>}` | JPEG/PNG/WebP photo ≤ 8 MB → `{id}` |
| POST | `submission` | `{country, synthetic, title, date, location, event, photo_ids:[…]}` | Creates a report |
| GET | `file/<id>` | | Original file |
| GET | `result/<id>` | | Gathering result (observations, provisional estimate) |

## Vision
| Method | Path | Body | Role |
|---|---|---|---|
| POST | `segment` | `{id:<report>, photo_id, resource}` | Object detection (counts 1 "detection"); `resource` ∈ chairs, tents, vehicles, banners, screens, lighting |
| GET | `segments/<report>` · `segment/<id>` | | Saved detections |
| POST | `segment-review` | `{id, accepted_ids:[…], manual_boxes:[…]}` | Your correction: kept objects, added boxes |
| POST | `analyse` | `{id:<report>}` | Scene reading by the model (counts 1 "detection") |

Video: `video/start`, `video/chunk/<id>`, `video/finish`, `video/status/<id>` (same bodies as the interface, see `web/video-client.js`).

## Refused to a team key (403)
Review and approval, draft estimates, creating prices, parties or campaigns, members, exports, the whole Lab.

## Errors
`401` missing or revoked key · `403` not part of the team API · `429` daily limit reached · `400` invalid request (plain message in `error`).
