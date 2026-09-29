# Mapomo — kit équipe / team starter

Votre propre Mapomo : l'interface complète, modifiable, branchée sur le moteur Mapomo par une clé d'équipe.
*Your own Mapomo: the full interface, yours to change, plugged into the Mapomo engine with a team key.*

## Démarrer (5 minutes, Node 20+)

```bash
cp .env.example .env        # collez la clé donnée par l'organisation : MAPOMO_KEY=mpk_…
node server.mjs             # puis ouvrez http://localhost:5173/field/
```

Aucune dépendance à installer. La clé reste dans `.env`, sur votre machine : `server.mjs` l'ajoute aux appels. Ne la mettez jamais dans `web/`, elle serait visible dans le navigateur.

## Ce que vous pouvez changer

| Où | Quoi |
|---|---|
| `web/` | Toute l'interface : `index.html`, `app.js` (pages, formulaires), `agent-client.js` (le chat), `style.css`, `i18n.js` (textes FR/EN), `result-view.js`, `segmentation-view.js`. Rechargez la page après modification. |
| `examples/team-instructions.mjs` | Les **consignes d'équipe** de l'agent : ton, format, priorités, langue. |
| `examples/` | Vos propres scripts qui enchaînent les opérations (photo → rapport → détection → question à l'agent…). |
| `mapomo.mjs` | Le petit client utilisé par les scripts. |

## Ce qui reste côté Mapomo (derrière l'API)

La boucle de l'agent et ses outils, la détection d'objets et l'analyse d'images, les modèles et leurs clés, la méthode de valorisation de référence, la validation (« approuvé »), les prix de référence, les données des autres équipes, le Lab. Vos consignes s'ajoutent **après** les règles fixes de l'agent : elles ne peuvent pas lui faire inventer un chiffre ni supprimer statuts, sources et inconnues.

## Limites

Votre clé ne voit que les preuves et conversations de votre équipe. Plafonds par jour : messages à l'agent et détections (voir `node examples/me.mjs`). Au-delà, l'API répond 429 : demandez à l'organisation.

## Documentation

- Français : [guide complet](docs/fr/GUIDE.md) · [référence API](docs/fr/API.md)
- English: [full guide](docs/en/GUIDE.md) · [API reference](docs/en/API.md)

Méthode de valorisation, en lecture : `reference/valuation.mjs`. Vérifier que le serveur exécute la même : `node examples/method.mjs`.

