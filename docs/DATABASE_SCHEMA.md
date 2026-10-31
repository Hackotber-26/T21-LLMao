# SOLVYN – Supabase Database Schema Documentation

## 1. Entity Relationship Overview

```
auth.users (Supabase Managed)
    │ 1:1
    ▼
public.profiles
    │ 1:N                          │ 1:N
    ├───────────────┐              ├──────────────┐
    ▼               ▼              ▼              ▼
public.reports   public.solutions (1:N) ──► public.solution_likes
    ▲               ▲
    │ N:1           │ N:1
    └───────┬───────┘
            │
      public.problems (Aggregated Clusters)
```

---

## 2. Tables & Column Specifications

### `public.profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, references `auth.users(id) ON DELETE CASCADE` | User ID |
| `username` | `TEXT` | `UNIQUE`, `NOT NULL` | Handle for profile URL |
| `full_name` | `TEXT` | `NULLABLE` | Display name |
| `avatar_url` | `TEXT` | `NULLABLE` | Profile picture link |
| `bio` | `TEXT` | `NULLABLE` | User description |
| `skills` | `TEXT[]` | `DEFAULT '{}'` | Array of technical & domain skills |
| `interests` | `TEXT[]` | `DEFAULT '{}'` | Areas of interest |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Last modified |

---

### `public.problems`
*Aggregated problem clusters.*

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Cluster ID |
| `title` | `TEXT` | `NOT NULL` | AI-normalized problem title |
| `description` | `TEXT` | `NOT NULL` | Structured problem overview |
| `category` | `TEXT` | `NULLABLE` | e.g., Transportation, Healthcare |
| `keywords` | `TEXT[]` | `DEFAULT '{}'` | Extracted search keywords |
| `urgency` | `TEXT` | `DEFAULT 'medium'` | low, medium, high, critical |
| `target_users` | `TEXT[]` | `DEFAULT '{}'` | Affected target audiences |
| `status` | `TEXT` | `DEFAULT 'open'` | `open`, `in_progress`, `solved`, `archived` |
| `report_count` | `INTEGER` | `DEFAULT 0`, `CHECK >= 0` | Auto-updated by DB trigger |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Last modified |

---

### `public.reports`
*Raw individual user submissions (Never discarded or altered).*

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Report ID |
| `problem_id` | `UUID` | `REFERENCES problems(id) ON DELETE CASCADE` | Associated cluster |
| `user_id` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | Submitting user |
| `original_text` | `TEXT` | `NOT NULL` | Original user report text |
| `sub_problem` | `TEXT` | `NULLABLE` | Identified sub-facet |
| `category` | `TEXT` | `NULLABLE` | Categorization |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Submission timestamp |

---

### `public.solutions`
*Submitted solutions for problems.*

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Solution ID |
| `problem_id` | `UUID` | `REFERENCES problems(id) ON DELETE CASCADE` | Solved problem |
| `user_id` | `UUID` | `REFERENCES profiles(id) ON DELETE CASCADE` | Solver profile |
| `title` | `TEXT` | `NOT NULL` | Solution name |
| `description` | `TEXT` | `NOT NULL` | Detailed explanation |
| `github_url` | `TEXT` | `NULLABLE` | Repository URL |
| `demo_url` | `TEXT` | `NULLABLE` | Interactive demo URL |
| `live_url` | `TEXT` | `NULLABLE` | Production URL |
| `video_url` | `TEXT` | `NULLABLE` | Video walkthrough |
| `like_count` | `INTEGER` | `DEFAULT 0`, `CHECK >= 0` | Auto-maintained by DB trigger |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Last modified |

---

### `public.solution_likes`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Record ID |
| `solution_id` | `UUID` | `REFERENCES solutions(id) ON DELETE CASCADE` | Liked solution |
| `user_id` | `UUID` | `REFERENCES profiles(id) ON DELETE CASCADE` | Liker user ID |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Timestamp |
| **Constraint** | `UNIQUE(solution_id, user_id)` | Prevents duplicate likes |

---

## 3. Database Triggers

1. **`on_auth_user_created`**:  
   Listens to `auth.users` on `INSERT`. Automatically creates a row in `public.profiles` using user metadata or sanitized email handle.

2. **`trigger_update_problem_report_count`**:  
   Listens to `public.reports` on `INSERT`, `UPDATE`, `DELETE`. Increments or decrements `problems.report_count` reliably. Never allows manual tampering from client.

3. **`trigger_update_solution_like_count`**:  
   Listens to `public.solution_likes` on `INSERT`, `DELETE`. Maintains `solutions.like_count`.
