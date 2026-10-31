# SOLVYN – API Contracts & Integration Guide

**Version**: 1.0.0  
**Backend Lead**: Member 2  
**Target Audience**: Member 1 (Frontend), Member 3 (AI Engineer), Member 4 (Solutions & Integration)

---

## 1. Response Standard

All endpoints return a uniform JSON format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message",
    "details": { ... }
  }
}
```

---

## 2. API Endpoints

### 1. `GET /api/problems`
*Discovery feed for aggregated problem statements.*

* **Auth**: Public
* **Query Parameters**:
  * `q`: (string, optional) Search keyword in title, description, category.
  * `category`: (string, optional) Filter by category.
  * `status`: (string, optional) Filter by status (`open`, `in_progress`, `solved`, `archived`).
  * `sort`: (string, default: `newest`) One of: `newest`, `oldest`, `most_reported`, `trending`.
  * `page`: (number, default: 1)
  * `limit`: (number, default: 20, max: 100)
* **Response `data`**:
```json
{
  "items": [
    {
      "id": "e7b0d778-9e5c-44bf-a548-c96fa049b1a2",
      "title": "Improving BMTC Bus Tracking and UI Experience",
      "description": "Daily commuters face significant friction navigating the transit app and getting reliable real-time tracking.",
      "category": "Transportation",
      "keywords": ["BMTC", "transportation", "bus tracking"],
      "urgency": "medium",
      "target_users": ["Daily commuters", "Students"],
      "status": "open",
      "report_count": 14,
      "created_at": "2026-10-31T05:00:00.000Z",
      "updated_at": "2026-10-31T05:10:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 2. `GET /api/problems/[id]`
*Detailed view of a problem, including sub-problem breakdown and submitted solutions.*

* **Auth**: Public (if authenticated, `has_liked` flags reflect current user).
* **Parameters**: `id` (UUID).
* **Response `data`**:
```json
{
  "id": "e7b0d778-9e5c-44bf-a548-c96fa049b1a2",
  "title": "Improving BMTC Bus Tracking and UI Experience",
  "description": "Daily commuters face significant friction navigating the transit app...",
  "category": "Transportation",
  "keywords": ["BMTC", "transportation"],
  "urgency": "medium",
  "target_users": ["Daily commuters"],
  "status": "open",
  "report_count": 3,
  "created_at": "2026-10-31T05:00:00.000Z",
  "updated_at": "2026-10-31T05:10:00.000Z",
  "sub_problems": [
    { "name": "Poor UI/UX", "count": 2 },
    { "name": "GPS Tracking Inaccuracy", "count": 1 }
  ],
  "sample_reports": [
    {
      "id": "8b52ca74-1234-5678-90ab-cdef12345678",
      "original_text": "The BMTC app has a terrible interface and confusing menus.",
      "sub_problem": "Poor UI/UX",
      "created_at": "2026-10-31T05:02:00.000Z"
    }
  ],
  "solutions": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "title": "Live Transit Route Visualizer",
      "description": "An open-source progressive web app using open transit GTFS-RT APIs.",
      "github_url": "https://github.com/example/transit-tracker",
      "demo_url": "https://demo.example.com",
      "like_count": 8,
      "has_liked": true,
      "solver": {
        "id": "c1f20b82-9999-4372-a567-0e02b2c3d479",
        "username": "alex_dev",
        "full_name": "Alex Kumar",
        "avatar_url": null
      }
    }
  ]
}
```

---

### 3. `POST /api/reports`
*Submit a real-world problem report. Triggers AI classification and clustering.*

* **Auth**: Authenticated (Supabase Session required).
* **Body**:
```json
{
  "original_text": "I wait over 45 minutes for bus 500D because the arrival time shown in the app is completely inaccurate.",
  "category": "Transportation",
  "location": "Bengaluru"
}
```
* **Status**: `201 Created`
* **Response `data`**:
```json
{
  "report": {
    "id": "9a0a1f2c-...",
    "problem_id": "e7b0d778-...",
    "original_text": "I wait over 45 minutes...",
    "sub_problem": "GPS Tracking Inaccuracy",
    "category": "Transportation",
    "created_at": "2026-10-31T05:15:00.000Z"
  },
  "problem": {
    "id": "e7b0d778-...",
    "title": "Improving BMTC Bus Tracking and UI Experience",
    "report_count": 4,
    "status": "open"
  },
  "ai_classification": { ... },
  "ai_matching": {
    "match_found": true,
    "matched_problem_id": "e7b0d778-...",
    "confidence": 0.93,
    "sub_problem": "GPS Tracking Inaccuracy"
  }
}
```

---

### 4. `POST /api/solutions`
*Submit a solution.*

* **Auth**: Authenticated.
* **Body**:
```json
{
  "problem_id": "e7b0d778-9e5c-44bf-a548-c96fa049b1a2",
  "title": "BMTC Live Tracking Application",
  "description": "A high-performance progressive web app with crowd-sourced bus location telemetry.",
  "github_url": "https://github.com/myteam/solvyn-bus",
  "demo_url": "https://solvyn-bus.vercel.app",
  "live_url": null,
  "video_url": null
}
```
* **Status**: `201 Created`

---

### 5. `GET /api/solutions/[id]`
*Fetch solution details.*

* **Auth**: Public (supports auth for `has_liked`).
* **Parameters**: `id` (UUID).

---

### 6. `POST /api/solutions/[id]/like`
*Toggle like on a solution.*

* **Auth**: Authenticated.
* **Response `data`**:
```json
{
  "liked": true,
  "like_count": 9
}
```

---

### 7. `GET /api/profile/[username]`
*Fetch public profile, badges, reported problems count, and submitted solutions.*

* **Auth**: Public.
* **Parameters**: `username` (string).

---

### 8. `PATCH /api/profile/[username]`
*Update authenticated user's own profile.*

* **Auth**: Authenticated (must match username's user ID).
* **Body**:
```json
{
  "full_name": "Jane Doe",
  "bio": "Building impact solutions",
  "skills": ["Next.js", "Python", "FastAPI"],
  "interests": ["Urban Mobility", "Renewable Energy"]
}
```

---

### 9. `POST /api/chat`
*AI Assistant for problem discovery and solution brainstorming.*

* **Auth**: Public / Authenticated.
* **Body**:
```json
{
  "message": "What are the most urgent transit problems reported in Bangalore?",
  "problem_id": "optional-uuid"
}
```
* **Response `data`**:
```json
{
  "reply": "Based on Solvyn's database..."
}
```
