# backend3/src - API MVC RCON

## Route principale

- `POST /api/messages/send`
- `GET /api/messages/online/:pseudo`

Params attendus (body JSON ou query params):

- `pseudo`: pseudo du joueur Minecraft
- `message`: message a envoyer

### Exemple body JSON

```json
{
  "pseudo": "losakan",
  "message": "Bonjour depuis backend3"
}
```

### Exemple curl

```bash
curl -X POST http://localhost:3003/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"pseudo":"losakan","message":"Hello"}'
```

### Verifier si un joueur est connecte

```bash
curl http://localhost:3003/api/messages/online/losakan
```

Exemple de reponse:

```json
{
  "ok": true,
  "pseudo": "losakan",
  "online": true,
  "onlinePlayers": ["losakan"],
  "command": "list",
  "response": "There are 1 of a max of 20 players online: losakan"
}
```
