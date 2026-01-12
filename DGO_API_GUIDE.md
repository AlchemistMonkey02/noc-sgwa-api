# DGO Officer Portal - API Mapping by Screen

**Base URL**: `http://localhost:3000/api`

## Screen 1: Login
**Function**: Officer Authentication
- **Login API**: `POST /api/auth/login`
  - Payload: `{ "email": "...", "password": "..." }`
  - Response: `{ "token": "...", "user": { ... } }`

## Screen 2: Dashboard (Home)
**Function**: Overview of assigned work and statistics.
- **Fetch Stats**: `GET /api/officer/dgo/dashboard`
  - Returns: `{ "total": 50, "pending": 10, "approved": 35, ... }`
- **Recent Activity (Optional)**: `GET /api/officer/common/activity-log` (Stub implementation)

## Screen 3: Applications List
**Function**: Grid view of applications with filtering.
- **Fetch Applications**: `GET /api/officer/dgo/applications`
  - Supports pagination: `?page=1&limit=20`
  - Supports filtering: `?status=PENDING_DGO_REVIEW&districtId=Jaipur`
  - Search: `GET /api/officer/common/search?q=NOC-123&type=application`

## Screen 4: Application Details
**Function**: Detailed view of a single application (Tabs: Info, Documents, Location).
- **Fetch Details**: `GET /api/officer/dgo/applications/:id`
  - Returns full application object including nested `projectDetails`, `location`, `documents`.
- **View Document (By Type)**: `GET /api/officer/common/applications/:appId/documents/:docType/view`
  - Example: `/api/officer/common/applications/NOC-2026-001/documents/ID_PROOF/view`
- **Download Document**: `GET /api/officer/common/applications/:appId/documents/:docType/download`

## Screen 5: Inspection Management
**Function**: Scheduling and Reporting on Inspections.
- **Schedule Inspection**: `POST /api/officer/dgo/applications/:id/schedule-inspection`
  - Payload: `{ "inspectionDate": "YYYY-MM-DD" }`
- **Submit Report**: `POST /api/officer/dgo/applications/:id/inspection-report`
  - Payload: `{ "findings": "...", "coordinates": { "lat": ..., "lng": ... }, "recommendation": "APPROVE/REJECT" }`
- **View Report**: `GET /api/officer/dgo/inspections/:id/report`

## Screen 6: Actions (Modals/Forms)
**Function**: Taking final action on an application.
- **Forward to SGWA (Approve)**: `POST /api/officer/dgo/applications/:id/forward`
  - Payload: `{ "recommendation": "RECOMMEND_APPROVAL", "remarks": "..." }`
- **Reject**: `POST /api/officer/dgo/applications/:id/reject`
  - Payload: `{ "remarks": "..." }`
- **Raise Query**: `POST /api/officer/dgo/applications/:id/query`
  - Payload: `{ "subject": "...", "query": "...", "responseDeadline": "..." }`

## Screen 7: Profile
**Function**: Officer profile and password management.
- **Get Profile**: `GET /api/auth/profile`
- **Update Profile**: `PUT /api/auth/profile`
- **Change Password**: `POST /api/auth/change-password`

