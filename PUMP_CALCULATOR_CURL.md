# Pump Discharge Calculator API

**Endpoint:** `POST /api/tools/pump-discharge`

**Description:** Calculates the estimated water discharge rate based on the pump's Horsepower (HP) and the depth (Head) of the borewell.

**Parameters:**
*   `hp` (Number, required): Power of the pump in Horsepower.
*   `depth` (Number, required): Depth or Head in meters.
*   `efficiency` (Number, optional): Pump efficiency factor (0.0 - 1.0). Defaults to 0.6 (60%).

### Sample cURL Request

```bash
curl -X POST "http://localhost:5000/api/tools/pump-discharge" ^
  -H "Content-Type: application/json" ^
  -d "{\"hp\": 5, \"depth\": 100, \"efficiency\": 0.6}"
```

### Sample Response
```json
{
  "success": true,
  "data": {
    "hp": 5,
    "depth": 100,
    "efficiency": "60%",
    "estimatedDischargeLPS": 2.25,
    "estimatedDischargeM3Hr": 8.1,
    "formulaUsed": "Q (m³/hr) = ((HP × 75 × Efficiency) / Depth) × 3.6"
  }
}
```
