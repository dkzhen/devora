oke buat konsep untuk temp mail saya, dimana ini untuk public jadi nnti ketika sudah dapat email nya nnti ada token nya gtu untuk login dan bisa disave tokennya aja di cookie jd ketika web di refrsh emailnya ga ganti

- api url : https://api.mail.tm/
- pertama get domain yg tersedia dlu https://api.mail.tm/domains?page=1
nanti dapat nya {
  "@context": "/contexts/Domain",
  "@id": "/domains",
  "@type": "hydra:Collection",
  "hydra:totalItems": 1,
  "hydra:member": [
    {
      "@id": "/domains/698b6125924742a609a9f076",
      "@type": "Domain",
      "id": "698b6125924742a609a9f076",
      "domain": "dollicons.com",
      "isActive": true,
      "isPrivate": false,
      "createdAt": "2026-02-10T00:00:00+00:00",
      "updatedAt": "2026-02-10T00:00:00+00:00"
    }
  ]
}
- ambil domainnya saja 
- nanti generate emailnya paki domain itu 
curl -X 'POST' \
  'https://api.mail.tm/accounts' \
  -H 'accept: application/ld+json' \
  -H 'Content-Type: application/ld+json' \
  -d '{
  "address": "asyteurb@dollicons.com",
  "password": "string"
}'
- domain pakai yg di fetch tp username nya generate random tp kasih ciri chat depannya kasih devora misal devora_aydvt37@domain
- password di random juga tp disave dlu
- jika response nya 201 {
  "@context": "/contexts/Account",
  "@id": "/accounts/69a80f36b7e17a475d093c9c",
  "@type": "Account",
  "id": "69a80f36b7e17a475d093c9c",
  "address": "devora_eun@dollicons.com",
  "quota": 40000000,
  "used": 0,
  "isDisabled": false,
  "isDeleted": false,
  "createdAt": "2026-03-04T10:53:42+00:00",
  "updatedAt": "2026-03-04T10:53:42+00:00"
}, 
- jika email sudah digunakan biasanya response 422
- setelah mendapatkan address dan password maka generate token
curl -X 'POST' \
  'https://api.mail.tm/token' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "address": "devora_eun@dollicons.com",
  "password": "string"
}'
- nah ini dapat token {
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3NzI2MTg4MTcsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoiYXN5dGV1cmJAZG9sbGljb25zLmNvbSIsImlkIjoiNjlhODA0Mjk5OTM5NzU2NjE3MGNkYWYzIiwibWVyY3VyZSI6eyJzdWJzY3JpYmUiOlsiL2FjY291bnRzLzY5YTgwNDI5OTkzOTc1NjYxNzBjZGFmMyJdfX0.i6olj-vWXD8YXZFngOtrmtL55y9VG83vuL6L1y1NuRlEw5WYEhgy2hy5YuCxdE2-6aJei1MEs-xRoz55zF9Tow",
  "@id": "/accounts/69a8042999397566170cdaf3",
  "id": "69a8042999397566170cdaf3"
} simpan token ini di cokie atau local storage jadi kalau misal web refresh masih bisa kembali ke akun email ini.

![alt text](image.png)
ini untuk get image nya menggunakan auth token tadi