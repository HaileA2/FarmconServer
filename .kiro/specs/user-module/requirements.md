# Requirements Document

## Introduction

The User Module provides profile management and administrative user control for the FarmConnect platform. It exposes a set of authenticated REST endpoints under `/api/users` that allow users to view and update their own profiles, change passwords, and deactivate their accounts. It also provides admin-only endpoints for listing, inspecting, and managing all users. The module follows the same 4-file structure (controller, service, repository, router, validation) established by the auth module.

## Glossary

- **User_Module**: The Express sub-application mounted at `/api/users` that handles all user profile and admin user management operations.
- **User_Service**: The business logic layer of the User_Module.
- **User_Repository**: The data access layer of the User_Module that executes raw PostgreSQL queries via `query()` from `config/db`.
- **User_Controller**: The HTTP handler layer of the User_Module that delegates to User_Service and forwards errors to `next(e)`.
- **Authenticated_User**: A caller who has presented a valid JWT and whose `is_verified` flag is `true`, resulting in `req.user = { user_id, role, is_verified }` being set by the `authenticate` middleware.
- **Admin**: An Authenticated_User whose `role` is `admin`.
- **Profile**: The subset of user record fields that a user may read or update: `user_id`, `name`, `email`, `phone`, `role`, `is_verified`, `is_active`, `location`, `fcm_token`, `created_at`, `updated_at`. The `password_hash` field is never included in any Profile response.
- **Updatable_Profile_Fields**: The fields a user may change on their own profile: `name`, `phone`, `location`, `fcm_token`.
- **Admin_Updatable_Fields**: The fields an Admin may change on any user record: `role`, `is_active`.
- **AppError**: The operational error class `AppError(message, statusCode)` used throughout the platform to signal expected error conditions.

---

## Requirements

### Requirement 1: Get Own Profile

**User Story:** As an authenticated user, I want to retrieve my own profile, so that I can view my current account information.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends `GET /api/users/me`, THE User_Controller SHALL return HTTP 200 with the caller's Profile.
2. THE User_Repository SHALL retrieve the user record by `user_id` from the `users` table using the `user_id` from `req.user`.
3. IF no user record is found for the given `user_id`, THEN THE User_Service SHALL throw an AppError with message `"User not found"` and status code `404`.
4. THE User_Controller SHALL exclude `password_hash` from all Profile responses.

---

### Requirement 2: Update Own Profile

**User Story:** As an authenticated user, I want to update my profile information, so that I can keep my name, phone number, location, and FCM token current.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends `PATCH /api/users/me` with a valid request body, THE User_Controller SHALL return HTTP 200 with the updated Profile.
2. THE User_Module SHALL accept only Updatable_Profile_Fields (`name`, `phone`, `location`, `fcm_token`) in the request body; all other fields SHALL be ignored.
3. THE User_Module SHALL require at least one Updatable_Profile_Field to be present in the request body; IF no valid field is provided, THEN THE User_Module SHALL return HTTP 400.
4. WHEN `phone` is provided and it already belongs to a different user, THE User_Service SHALL throw an AppError with message `"Phone number already in use"` and status code `409`.
5. THE User_Repository SHALL update only the supplied fields and set `updated_at = NOW()` on the `users` row identified by `user_id`.
6. THE User_Module SHALL validate `name` as a string between 2 and 100 characters when provided.
7. THE User_Module SHALL validate `phone` as a string matching the pattern `/^\+?[0-9]{7,15}$/` when provided.
8. THE User_Module SHALL validate `location` as a string with a maximum length of 255 characters when provided.
9. THE User_Module SHALL validate `fcm_token` as a string when provided.

---

### Requirement 3: Change Password

**User Story:** As an authenticated user, I want to change my password, so that I can maintain the security of my account.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends `PATCH /api/users/me/password` with `current_password` and `new_password`, THE User_Controller SHALL return HTTP 200 with a success message.
2. THE User_Module SHALL require both `current_password` and `new_password` fields; IF either is absent, THEN THE User_Module SHALL return HTTP 400.
3. THE User_Module SHALL validate `new_password` as a string of at least 8 characters.
4. IF `current_password` does not match the stored `password_hash` for the caller, THEN THE User_Service SHALL throw an AppError with message `"Current password is incorrect"` and status code `401`.
5. THE User_Repository SHALL update `password_hash` and set `updated_at = NOW()` for the user identified by `user_id`.
6. THE User_Service SHALL hash `new_password` using the platform's `hashPassword` utility before persisting it.

---

### Requirement 4: Deactivate Own Account

**User Story:** As an authenticated user, I want to deactivate my account, so that I can stop using the platform without permanently deleting my data.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends `DELETE /api/users/me`, THE User_Controller SHALL return HTTP 200 with a success message.
2. THE User_Repository SHALL set `is_active = false` and `updated_at = NOW()` on the `users` row identified by `user_id`; THE User_Repository SHALL NOT delete the row.
3. IF the user's account is already inactive (`is_active = false`), THEN THE User_Service SHALL throw an AppError with message `"Account is already deactivated"` and status code `400`.

---

### Requirement 5: Admin — List All Users

**User Story:** As an admin, I want to list all registered users, so that I can monitor and manage the platform's user base.

#### Acceptance Criteria

1. WHEN an Admin sends `GET /api/users`, THE User_Controller SHALL return HTTP 200 with an array of Profile objects.
2. THE User_Module SHALL reject requests to `GET /api/users` from any Authenticated_User whose `role` is not `admin` with HTTP 403.
3. THE User_Module SHALL support an optional `role` query parameter; WHEN provided, THE User_Repository SHALL filter results to users matching that role.
4. THE User_Module SHALL support an optional `is_active` query parameter (`true` or `false`); WHEN provided, THE User_Repository SHALL filter results to users matching that active status.
5. THE User_Repository SHALL return results ordered by `created_at DESC`.
6. THE User_Controller SHALL exclude `password_hash` from all user objects in the response array.

---

### Requirement 6: Admin — Get User by ID

**User Story:** As an admin, I want to retrieve any user's profile by their ID, so that I can inspect individual accounts.

#### Acceptance Criteria

1. WHEN an Admin sends `GET /api/users/:id` with a valid UUID, THE User_Controller SHALL return HTTP 200 with the matching Profile.
2. THE User_Module SHALL reject requests to `GET /api/users/:id` from any Authenticated_User whose `role` is not `admin` with HTTP 403.
3. THE User_Module SHALL validate that `:id` is a valid UUID format; IF the format is invalid, THEN THE User_Module SHALL return HTTP 400.
4. IF no user record exists for the given `:id`, THEN THE User_Service SHALL throw an AppError with message `"User not found"` and status code `404`.
5. THE User_Controller SHALL exclude `password_hash` from the Profile response.

---

### Requirement 7: Admin — Update User Role or Status

**User Story:** As an admin, I want to update a user's role or active status, so that I can manage access control and account standing on the platform.

#### Acceptance Criteria

1. WHEN an Admin sends `PATCH /api/users/:id` with a valid request body, THE User_Controller SHALL return HTTP 200 with the updated Profile.
2. THE User_Module SHALL reject requests to `PATCH /api/users/:id` from any Authenticated_User whose `role` is not `admin` with HTTP 403.
3. THE User_Module SHALL accept only Admin_Updatable_Fields (`role`, `is_active`) in the request body; all other fields SHALL be ignored.
4. THE User_Module SHALL require at least one Admin_Updatable_Field to be present; IF neither is provided, THEN THE User_Module SHALL return HTTP 400.
5. THE User_Module SHALL validate `role` as one of `farmer`, `buyer`, `transporter`, `admin` when provided.
6. THE User_Module SHALL validate `is_active` as a boolean when provided.
7. THE User_Module SHALL validate that `:id` is a valid UUID format; IF the format is invalid, THEN THE User_Module SHALL return HTTP 400.
8. IF no user record exists for the given `:id`, THEN THE User_Service SHALL throw an AppError with message `"User not found"` and status code `404`.
9. THE User_Repository SHALL update only the supplied Admin_Updatable_Fields and set `updated_at = NOW()` on the matching `users` row.
10. THE User_Controller SHALL exclude `password_hash` from the Profile response.

---

### Requirement 8: Authentication and Authorization Guards

**User Story:** As a platform operator, I want all user endpoints to enforce authentication and role-based access control, so that unauthorized callers cannot access or modify user data.

#### Acceptance Criteria

1. THE User_Module SHALL apply the `authenticate` middleware to all routes under `/api/users`.
2. WHEN a request arrives without a valid JWT, THE User_Module SHALL return HTTP 401.
3. WHEN a request arrives with a JWT belonging to an unverified account, THE User_Module SHALL return HTTP 403.
4. THE User_Module SHALL apply the `authorize('admin')` middleware to `GET /api/users`, `GET /api/users/:id`, and `PATCH /api/users/:id`.

---

### Requirement 9: Router Registration

**User Story:** As a backend developer, I want the user router mounted in `app.js`, so that all user endpoints are reachable under `/api/users`.

#### Acceptance Criteria

1. THE User_Module SHALL export an Express Router from `src/modules/user/router.js`.
2. THE `app.js` SHALL mount the User_Module router at the path `/api/users`.
