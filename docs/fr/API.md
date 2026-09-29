# API équipe Mapomo — `/api/v1`

Base : `https://workspace-production-5979.up.railway.app/api/v1/` · En-tête : `Authorization: Bearer mpk_…`
JSON en entrée et en sortie. `server.mjs` expose les mêmes chemins en local sous `/field-api/…` (c'est ce qu'utilise `web/`).

## Équipe
| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `method` | Code source exact de la méthode de valorisation exécutée par le serveur, et son sha256 |
| GET | `me` | Équipe, plafonds du jour, consommation, consignes actuelles |
| POST | `instructions` | `{text}` (≤ 4000 car.) — consignes d'équipe ajoutées à l'agent |

## Agent (la boucle tourne sur le serveur)
| Méthode | Chemin | Corps | Rôle |
|---|---|---|---|
| POST | `agent/open` | `{case_id?}` | Ouvre la conversation (générale ou d'un dossier) → `conversation_id` |
| POST | `agent/send` | `{conversation_id, text, request_id, attachments?}` | Envoie un message (compte 1 « message ») |
| POST | `agent/advance` | `{conversation_id, run_id}` | Fait avancer la réponse ; répéter tant que `run.status` vaut `queued`/`running` |
| GET | `agent/history` | | Conversations précédentes |

`request_id` : 8 à 100 caractères `[A-Za-z0-9_-]`, unique par message (un renvoi avec le même ID ne crée pas de doublon).

## Preuves
| Méthode | Chemin | Corps | Rôle |
|---|---|---|---|
| GET | `state` | | Vos rapports, analyses, prix et partis de référence (lecture) |
| POST | `upload` | `{country:'SN', synthetic:true, name, data:<base64>}` | Photo JPEG/PNG/WebP ≤ 8 Mo → `{id}` |
| POST | `submission` | `{country, synthetic, title, date, location, event, photo_ids:[…]}` | Crée un rapport |
| GET | `file/<id>` | | Fichier d'origine |
| GET | `result/<id>` | | Résultat d'un rassemblement (observations, estimation provisoire) |

## Vision
| Méthode | Chemin | Corps | Rôle |
|---|---|---|---|
| POST | `segment` | `{id:<rapport>, photo_id, resource}` | Détection d'objets (compte 1 « détection ») ; `resource` ∈ chairs, tents, vehicles, banners, screens, lighting |
| GET | `segments/<rapport>` · `segment/<id>` | | Détections enregistrées |
| POST | `segment-review` | `{id, accepted_ids:[…], manual_boxes:[…]}` | Votre correction : objets retenus, boîtes ajoutées |
| POST | `analyse` | `{id:<rapport>}` | Lecture de la scène par le modèle (compte 1 « détection ») |

Vidéo : `video/start`, `video/chunk/<id>`, `video/finish`, `video/status/<id>` (mêmes corps que l'interface, voir `web/video-client.js`).

## Refusé à une clé d'équipe (403)
Validation et revue, brouillons d'estimation, création de prix, partis ou campagnes, membres, exports, tout le Lab.

## Erreurs
`401` clé absente ou révoquée · `403` opération hors API équipe · `429` plafond du jour atteint · `400` requête invalide (message en clair dans `error`).
