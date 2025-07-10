# Subscription API Example cURL Commands

## 1. Manage Plans (`/api/subscription/plans`)

### List all plans

```bash
curl -X GET http://localhost:3000/api/subscription/plans
```

### Create a new plan

```bash
curl -X POST http://localhost:3000/api/subscription/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro",
    "price": 499,
    "features": ["Unlimited items", "Priority support"],
    "isActive": true
  }'
```

### Update a plan

```bash
curl -X PATCH http://localhost:3000/api/subscription/plans \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<PLAN_ID>",
    "update": { "price": 599 }
  }'
```

### Delete a plan

```bash
curl -X DELETE http://localhost:3000/api/subscription/plans \
  -H "Content-Type: application/json" \
  -d '{ "id": "<PLAN_ID>" }'
```

---

## 2. Assign Plan to User (`/api/subscription/assign`)

```bash
curl -X POST http://localhost:3000/api/subscription/assign \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "planId": "<PLAN_ID>"
  }'
```

---

## 3. Migrate All Users to Free Plan (`/api/subscription/migrate-free`)

```bash
curl -X POST http://localhost:3000/api/subscription/migrate-free
```

---

## 4. New User Signup (linked to Free plan by default)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "yourpassword",
    "name": "New User"
  }'
```

---

**Note:**

- Replace `<PLAN_ID>` and `<USER_ID>` with actual IDs from your database.
- All endpoints assume your server is running on `http://localhost:3000`.
