- BASE URL : https://devora.dkzhen.org
 Header Authorization : Bearer <api key>

- generate email : POST /api/v1/temp-mail/accounts
  nnti dapat 

{
  "success": true,
  "account": {
    "id": "...",
    "address": "devora_ab12cd34@example.com",
    "password": "mypassword",
    "token": "eyJhbGciOi...",
    "createdAt": "2026-03-28T12:00:00.000Z"
  }
}

- get inbox 
GET /api/v1/temp-mail/accounts/{id account}/messages
response 
[
  {
    "id": "...",
    "from": { "name": "Sender", "address": "sender@domain.com" },
    "subject": "Hello!",
    "intro": "Preview of the email...",
    "seen": false,
    "createdAt": "..."
  }
]