# Officer Login Credentials

## DGO Officer
- **Username:** `dgo_admin`
- **Password:** `password123`
- **Role:** DGO
- **District:** Jaipur

## SGWA Officer
- **Username:** `sgwa_admin`
- **Password:** `password123`
- **Role:** RSGWA
- **District:** Jaipur

## Enforcement Officer
- **Username:** `enforcement_admin`
- **Password:** `password123`
- **Role:** ENFORCEMENT
- **District:** Jaipur

---

## Login Examples

### DGO Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}'
```

### SGWA Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sgwa_admin","password":"password123"}'
```

### Enforcement Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"enforcement_admin","password":"password123"}'
```
