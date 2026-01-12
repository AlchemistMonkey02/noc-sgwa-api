# Officer API Full URL List

Base URL: `http://localhost:3000`

## Authentication
| Method | Full URL | Notes |
| :--- | :--- | :--- |
| POST | `http://localhost:3000/api/auth/login` | Email/Password login |
| POST | `http://localhost:3000/api/auth/logout` | |
| GET | `http://localhost:3000/api/auth/profile` | |

## Common (All Officers)
| Method | Full URL | Notes |
| :--- | :--- | :--- |
| GET | `http://localhost:3000/api/officer/common/search?q=XYZ&type=application` | Search |
| GET | `http://localhost:3000/api/officer/common/documents/:id/download` | Download by Document ID |
| GET | `http://localhost:3000/api/officer/common/documents/:id/view` | View by Document ID |
| GET | `http://localhost:3000/api/officer/common/applications/:appId/documents/:docType/view` | **View by App ID & Type** |
| GET | `http://localhost:3000/api/officer/common/applications/:appId/documents/:docType/download` | **Download by App ID & Type** |
| GET | `http://localhost:3000/api/officer/common/master-data/districts` | |
| GET | `http://localhost:3000/api/officer/common/master-data/blocks?districtId=Jaipur` | |

## DGO Module
| Method | Full URL | Notes |
| :--- | :--- | :--- |
| GET | `http://localhost:3000/api/officer/dgo/dashboard` | Dashboard Stats |
| GET | `http://localhost:3000/api/officer/dgo/applications` | List Applications |
| GET | `http://localhost:3000/api/officer/dgo/applications/:id` | Get Details |
| POST | `http://localhost:3000/api/officer/dgo/applications/:id/forward` | Approve/Forward |
| POST | `http://localhost:3000/api/officer/dgo/applications/:id/reject` | Reject |
| POST | `http://localhost:3000/api/officer/dgo/applications/:id/query` | Raise Query |
| POST | `http://localhost:3000/api/officer/dgo/applications/:id/schedule-inspection` | Schedule Inspection |
| POST | `http://localhost:3000/api/officer/dgo/applications/:id/inspection-report` | Submit Report |
| GET | `http://localhost:3000/api/officer/dgo/inspections/:id/report` | View Report |

## SGWA Module
| Method | Full URL | Notes |
| :--- | :--- | :--- |
| GET | `http://localhost:3000/api/officer/sgwa/dashboard` | Dashboard Stats |
| GET | `http://localhost:3000/api/officer/sgwa/applications` | List Applications |
| GET | `http://localhost:3000/api/officer/sgwa/applications/:id` | Get Details |
| POST | `http://localhost:3000/api/officer/sgwa/applications/:id/approve` | Approve |
| POST | `http://localhost:3000/api/officer/sgwa/applications/:id/reject` | Reject |
| POST | `http://localhost:3000/api/officer/sgwa/applications/:id/query` | Raise Query |
| POST | `http://localhost:3000/api/officer/sgwa/applications/:id/assign` | Assign Officer |

## Enforcement Wing
| Method | Full URL | Notes |
| :--- | :--- | :--- |
| GET | `http://localhost:3000/api/officer/enforcement/dashboard` | Dashboard Stats |
| GET | `http://localhost:3000/api/officer/enforcement/approval-queue` | Pending Final Approvals |
| GET | `http://localhost:3000/api/officer/enforcement/nocs` | Active NOCs |
| POST | `http://localhost:3000/api/officer/enforcement/applications/:id/issue-noc` | Issue NOC |
| POST | `http://localhost:3000/api/officer/enforcement/applications/:id/return` | Return to SGWA |
| POST | `http://localhost:3000/api/officer/enforcement/nocs/:id/revoke` | Revoke NOC |
| GET | `http://localhost:3000/api/officer/enforcement/compliance/stats` | Compliance Stats |
