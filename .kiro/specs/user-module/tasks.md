# Implementation Plan: User Module

## Overview

Implement the User Module for FarmConnect following the auth module's layered architecture. Five files go in `src/modules/user/`, plus a mount in `app.js`. All routes live under `/api/users`.

## Tasks

- [x] 1. Create `src/modules/user/validation.js`
  - Define `updateProfileSchema`: optional `name` (string 2–100), `phone` (pattern `/^\+?[0-9]{7,15}$/`), `location` (string max 255), `fcm_token` (string); require at least one via `.or()`
  - Define `changePasswordSchema`: `current_password` (string, required), `new_password` (string min 8, required)
  - Define `adminUpdateSchema`: optional `role` (valid enum: farmer/buyer/transporter/admin), `is_active` (boolean); require at least one via `.or()`
  - Define `uuidParamSchema`: `id` as `Joi.string().uuid().required()`
  - Mirror the style of `src/modules/auth/validation.js`
  - _Requirements: 2.2, 2.3, 2.6, 2.7, 2.8, 2.9, 3.2, 3.3, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 1.1 Write property tests for validation schemas
    - **Property 9: Profile validation rejects out-of-range inputs**
    - **Validates: Requirements 2.6, 2.7, 2.8**
    - **Property 10: Admin update validation rejects invalid role or is_active values**
    - **Validates: Requirements 7.5, 7.6**
    - Use `fc.string()` arbitraries to generate out-of-range names, invalid phone patterns, oversized locations, and invalid role strings
    - Tag: `// Feature: user-module, Property 9` and `// Feature: user-module, Property 10`

- [x] 2. Create `src/modules/user/repository.js`
  - Implement `findById(user_id)`: `SELECT * FROM users WHERE user_id = $1`
  - Implement `findByPhone(phone, excludeUserId)`: `SELECT user_id FROM users WHERE phone = $1 AND user_id != $2`
  - Implement `updateUser(user_id, fields)`: build a dynamic parameterized SET clause from the `fields` object, append `updated_at = NOW()`, return `RETURNING *`
  - Implement `setInactive(user_id)`: `UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = $1`
  - Implement `findAll(filters)`: build a dynamic WHERE clause from optional `role` and `is_active` filters; always append `ORDER BY created_at DESC`
  - Use `query` from `../../config/db` — mirror `src/modules/auth/repository.js` style
  - _Requirements: 1.2, 2.5, 3.5, 4.2, 5.3, 5.4, 5.5, 7.9_

  - [ ]* 2.1 Write unit tests for repository functions
    - Mock `query` from `../../config/db`
    - Test `findAll` with no filters, `role` only, `is_active` only, and both filters
    - Test `updateUser` builds correct SET clause for single and multiple fields
    - Test `findByPhone` excludes the given `excludeUserId`
    - _Requirements: 2.5, 5.3, 5.4, 7.9_

  - [ ]* 2.2 Write property test for partial update (Property 3)
    - **Property 3: Partial update only modifies supplied fields**
    - **Validates: Requirements 2.5, 7.9**
    - Use `fc.record()` with optional keys to generate arbitrary subsets of updatable fields; assert non-supplied fields are unchanged in the returned row
    - Tag: `// Feature: user-module, Property 3`

  - [ ]* 2.3 Write property tests for list filter correctness (Properties 4 & 5)
    - **Property 4: List users role filter returns only matching users**
    - **Validates: Requirements 5.3**
    - **Property 5: List users is_active filter returns only matching users**
    - **Validates: Requirements 5.4**
    - Use `fc.constantFrom('farmer','buyer','transporter','admin')` and `fc.boolean()` arbitraries
    - Tag: `// Feature: user-module, Property 4` and `// Feature: user-module, Property 5`

  - [ ]* 2.4 Write property test for ordering invariant (Property 6)
    - **Property 6: List users result is ordered by created_at DESC**
    - **Validates: Requirements 5.5**
    - Use `fc.array(fc.record({ created_at: fc.date() }))` to generate mock result sets; assert adjacent pairs satisfy `a.created_at >= b.created_at`
    - Tag: `// Feature: user-module, Property 6`

- [ ] 3. Checkpoint — Ensure repository tests pass, ask the user if questions arise.

- [x] 4. Create `src/modules/user/service.js`
  - Implement `stripPassword(user)` helper: returns a copy of the user object with `password_hash` deleted
  - Implement `getProfile(user_id)`: call `repo.findById`, throw `AppError('User not found', 404)` if null, return `stripPassword(user)`
  - Implement `updateProfile(user_id, fields)`: if `phone` provided, call `repo.findByPhone` and throw `AppError('Phone number already in use', 409)` if result found; call `repo.updateUser`, return `stripPassword(updated)`
  - Implement `changePassword(user_id, current_password, new_password)`: fetch user, call `comparePassword`, throw `AppError('Current password is incorrect', 401)` on mismatch; hash new password with `hashPassword`; call `repo.updateUser({ password_hash })`; return `{ message: 'Password updated successfully' }`
  - Implement `deactivateAccount(user_id)`: fetch user, throw `AppError('Account is already deactivated', 400)` if `is_active === false`; call `repo.setInactive`; return `{ message: 'Account deactivated successfully' }`
  - Implement `listUsers(filters)`: delegate to `repo.findAll(filters)`, map results through `stripPassword`
  - Implement `getUserById(id)`: call `repo.findById`, throw `AppError('User not found', 404)` if null, return `stripPassword(user)`
  - Implement `adminUpdateUser(id, fields)`: call `repo.findById`, throw `AppError('User not found', 404)` if null; call `repo.updateUser(id, fields)`, return `stripPassword(updated)`
  - Use `hashPassword`, `comparePassword` from `../../Utils/hash` and `AppError` from `../../Utils/AppError`
  - _Requirements: 1.3, 1.4, 2.4, 2.5, 3.4, 3.5, 3.6, 4.2, 4.3, 5.1, 6.4, 7.8_

  - [ ]* 4.1 Write unit tests for service functions
    - Mock repository functions
    - Test each error condition: 404 not found, 409 phone conflict, 401 wrong password, 400 already deactivated
    - Test `stripPassword` removes `password_hash` and does not mutate the original object
    - _Requirements: 1.3, 2.4, 3.4, 4.3, 6.4, 7.8_

  - [ ]* 4.2 Write property test for no password_hash in responses (Property 1)
    - **Property 1: No password_hash in any profile response**
    - **Validates: Requirements 1.4, 5.6, 6.5, 7.10**
    - Use `fc.record()` to generate arbitrary user objects with a `password_hash` field; assert `!('password_hash' in stripPassword(user))`
    - Tag: `// Feature: user-module, Property 1`

  - [ ]* 4.3 Write property test for extra fields ignored (Property 11)
    - **Property 11: Extra fields in update bodies are ignored**
    - **Validates: Requirements 2.2, 7.3**
    - Use `fc.record()` with arbitrary extra keys; assert that after `updateProfile` / `adminUpdateUser`, the stored record does not contain those extra keys
    - Tag: `// Feature: user-module, Property 11`

  - [ ]* 4.4 Write property test for password round-trip (Property 7)
    - **Property 7: Password change round-trip**
    - **Validates: Requirements 3.5, 3.6**
    - Use `fc.string({ minLength: 8 })` to generate valid passwords; assert `comparePassword(pw, await hashPassword(pw))` resolves to `true`
    - Tag: `// Feature: user-module, Property 7`

  - [ ]* 4.5 Write property test for deactivation row preservation (Property 8)
    - **Property 8: Deactivation sets is_active=false without deleting the row**
    - **Validates: Requirements 4.2**
    - Mock `repo.setInactive` and `repo.findById`; assert that after `deactivateAccount`, the mocked row still exists with `is_active = false`
    - Tag: `// Feature: user-module, Property 8`

- [ ] 5. Checkpoint — Ensure service tests pass, ask the user if questions arise.

- [x] 6. Create `src/modules/user/controller.js`
  - Implement `getMe`: extract `req.user.user_id`, call `userService.getProfile`, return `res.status(200).json(profile)`
  - Implement `updateMe`: extract `req.user.user_id` + `req.body`, call `userService.updateProfile`, return `res.status(200).json(profile)`
  - Implement `changePassword`: extract `req.user.user_id` + `req.body.current_password` + `req.body.new_password`, call `userService.changePassword`, return `res.status(200).json(result)`
  - Implement `deleteMe`: extract `req.user.user_id`, call `userService.deactivateAccount`, return `res.status(200).json(result)`
  - Implement `listUsers`: pass `req.query` to `userService.listUsers`, return `res.status(200).json(users)`
  - Implement `getUserById`: pass `req.params.id` to `userService.getUserById`, return `res.status(200).json(profile)`
  - Implement `adminUpdateUser`: pass `req.params.id` + `req.body` to `userService.adminUpdateUser`, return `res.status(200).json(profile)`
  - All handlers use `try/catch` and forward errors via `next(e)` — mirror `src/modules/auth/controller.js`
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [ ]* 6.1 Write integration-style tests for controller endpoints using supertest
    - One happy-path test per endpoint
    - Key error cases: 401 (no token), 403 (non-admin on admin routes), 404 (user not found), 400 (bad body), 409 (phone conflict)
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 4.1, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3_

  - [ ]* 6.2 Write property test for non-admin rejection on admin routes (Property 2)
    - **Property 2: Non-admin role is rejected on admin-only routes**
    - **Validates: Requirements 5.2, 6.2, 7.2**
    - Use `fc.constantFrom('farmer', 'buyer', 'transporter')` to generate non-admin roles; assert each receives HTTP 403 on `GET /`, `GET /:id`, `PATCH /:id`
    - Tag: `// Feature: user-module, Property 2`

- [x] 7. Create `src/modules/user/router.js`
  - Import `authenticate` from `../../middlewares/authenticate`, `authorize` from `../../middlewares/authorize`, `validate` from `../../middlewares/validate`
  - Import all schemas from `./validation` and all handlers from `./controller`
  - Declare `/me` routes before `/:id` routes to prevent Express matching "me" as a UUID param
  - Apply `authenticate` to all routes (use `router.use(authenticate)`)
  - Wire routes:
    - `GET  /me`           → `getMe`
    - `PATCH /me`          → `validate(updateProfileSchema)` → `updateMe`
    - `PATCH /me/password` → `validate(changePasswordSchema)` → `changePassword`
    - `DELETE /me`         → `deleteMe`
    - `GET  /`             → `authorize('admin')` → `listUsers`
    - `GET  /:id`          → `authorize('admin')` → validate UUID param → `getUserById`
    - `PATCH /:id`         → `authorize('admin')` → validate UUID param → `validate(adminUpdateSchema)` → `adminUpdateUser`
  - For UUID param validation, validate `req.params` using a small inline middleware that calls `uuidParamSchema.validate(req.params)` and calls `next(new AppError(..., 400))` on error
  - Export the router
  - _Requirements: 6.3, 7.7, 8.1, 8.2, 8.3, 8.4, 9.1_

- [x] 8. Mount user router in `src/app.js`
  - Add `const userRouter = require('./modules/user/router');` after the existing `authRouter` import
  - Add `app.use('/api/users', userRouter);` after the existing `app.use('/api/auth', authRouter)` line
  - _Requirements: 9.2_

- [ ] 9. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fc.assert(fc.property(...), { numRuns: 100 })` with the tag format `// Feature: user-module, Property N: <property_text>`
- Unit tests complement property tests by covering specific examples and error conditions
