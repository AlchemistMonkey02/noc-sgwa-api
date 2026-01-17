# Inspection Report Submission cURL
## Submit Final Inspection Report (Matches Form)

**Endpoint:** `POST /api/officer/inspection/:inspectionId/submit`

**Payload Map:**
| Form Field | JSON Field | Type |
| :--- | :--- | :--- |
| Geolocation Verification | `geoLocation` | Object `{lat, lng, accuracy}` |
| Site location match application? | `locationMatch` | Boolean |
| Land use align with project? | `landUseMatch` | Boolean |
| Check existing borewells | `existingSources` | Number |
| Flow meter installed? | `meterInstalled` | String (`YES`, `NO`, `NA`) |
| Rainwater Harvesting Status | `rainwaterHarvesting` | String (`IMPLEMENTED`, `UNDER_CONSTRUCTION`, `NOT_STARTED`) |
| Upload Site Photos | `photos` | Array of Strings (IDs returned from upload API) |
| Officer Remarks | `remarks` | String |
| Final Recommendation | `recommendation` | String (`RECOMMENDED`, `CONDITIONAL`, `NOT_RECOMMENDED`) |

### cURL Request
```bash
curl -X POST "http://localhost:5000/api/officer/inspection/<INSPECTION_ID>/submit" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"locationMatch\": true, \"landUseMatch\": true, \"existingSources\": 0, \"meterInstalled\": \"NA\", \"rainwaterHarvesting\": \"NOT_STARTED\", \"plantationStatus\": \"NOT_STARTED\", \"remarks\": \"Site visited. Location verified. No existing borewells found. Proposed site matches application.\", \"recommendation\": \"RECOMMENDED\", \"geoLocation\": {\"lat\": 26.9124, \"lng\": 75.7873, \"accuracy\": 10}, \"photos\": [\"doc-uuid-1\", \"doc-uuid-2\"]}"
```
*Note: Ensure you have uploaded photos first using the `/upload-photo` endpoint and obtained the IDs.*
