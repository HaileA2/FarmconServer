# Implementation Plan: Product Module

## Overview

Implement the product module for FarmConnect following the established 5-file pattern from the user module. Tasks build incrementally from validation → repository → service → controller → router → app wiring.

## Tasks

- [x] 1. Create `src/modules/product/validation.js`
  - Define `createProductSchema`: required `title` (3–255), `price` (≥0), `quantity` (integer ≥0), `category` (2–100); optional `description` (max 2000), `location` (max 255)
  - Define `updateProductSchema`: same field rules, all optional, `.or(...)` requiring at least one updatable field
  - Define `updateStatusSchema`: required `status` one of `active`, `out_of_stock`, `deleted`
  - Define `listProductsQuerySchema`: optional `category` (string), `location` (string), `min_price` (number ≥0), `max_price` (number ≥0)
  - Define `uuidParamSchema`: `id` as UUID string (same as user module)
  - _Requirements: 1.3–1.9, 2.3, 2.7–2.8, 3.3, 5.8, 6.2, 7.3–7.5_

  - [ ]* 1.1 Write property test for validation schemas (Property 3, Property 4, Property 12, Property 14)
    - **Property 3: Invalid input fields are rejected with 400**
    - **Property 4: Invalid UUID param returns 400**
    - **Property 12: Invalid price filter values return 400**
    - **Property 14: Invalid status value returns 400**
    - **Validates: Requirements 1.3–1.9, 2.3, 2.8, 5.8, 7.5**

- [x] 2. Create `src/modules/product/repository.js`
  - Implement `insertProduct(fields)`: INSERT with explicit column list, `RETURNING *`
  - Implement `findByFarmer(farmer_id)`: SELECT all where `farmer_id = $1`, `ORDER BY created_at DESC`
  - Implement `findActive(filters)`: dynamic WHERE starting with `status = 'active'`, append `category`, `location`, `min_price`, `max_price` conditions using parameterized queries, `ORDER BY created_at DESC`
  - Implement `findById(id)`: SELECT where `product_id = $1`
  - Implement `updateProduct(id, fields)`: dynamic SET clause mirroring user repository pattern, `updated_at = NOW()`, `RETURNING *`
  - Implement `softDelete(id)`: UPDATE `status = 'deleted'`, `updated_at = NOW()`
  - Implement `updateStatus(id, status)`: UPDATE `status = $2`, `updated_at = NOW()`, `RETURNING *`
  - _Requirements: 1.10, 2.9, 3.6, 4.3, 5.2–5.7, 7.7_

  - [ ]* 2.1 Write property test for repository (Property 7, Property 8, Property 9, Property 10, Property 11)
    - **Property 7: Partial update preserves unmodified fields**
    - **Property 8: Soft-delete sets status to deleted without removing the row**
    - **Property 9: GET /my returns all farmer products regardless of status**
    - **Property 10: List active products only returns active products**
    - **Property 11: Filters narrow results correctly**
    - **Validates: Requirements 2.6, 2.9, 3.6, 4.3, 5.2–5.7**

- [x] 3. Create `src/modules/product/service.js`
  - Implement `createProduct(farmer_id, body)`: call `repo.insertProduct`, return full product row
  - Implement `getMyProducts(farmer_id)`: call `repo.findByFarmer`, return array
  - Implement `listProducts(filters)`: call `repo.findActive(filters)`, return array
  - Implement `getProductById(id)`: call `repo.findById`; throw `AppError('Product not found', 404)` if not found or `status === 'deleted'`
  - Implement `updateProduct(id, farmer_id, body)`: fetch product; throw 404 if not found; throw `AppError('Forbidden', 403)` if `farmer_id` mismatch; throw `AppError('Cannot update a deleted product', 400)` if deleted; call `repo.updateProduct`
  - Implement `deleteProduct(id, farmer_id)`: fetch product; throw 404 if not found; throw 403 if ownership mismatch; throw `AppError('Product is already deleted', 400)` if already deleted; call `repo.softDelete`
  - Implement `updateProductStatus(id, status)`: fetch product; throw 404 if not found; call `repo.updateStatus`
  - _Requirements: 1.1, 1.10–1.11, 2.4–2.5, 2.10, 3.4–3.7, 4.1, 4.3–4.4, 5.1, 5.9, 6.3–6.4, 7.6–7.8_

  - [ ]* 3.1 Write property test for service ownership and guard logic (Property 5, Property 6)
    - **Property 5: Non-existent product ID returns 404**
    - **Property 6: Ownership check returns 403**
    - **Validates: Requirements 2.4–2.5, 3.4–3.5, 6.3, 7.6**

- [x] 4. Create `src/modules/product/controller.js`
  - Implement thin async handlers following the user module pattern (try/catch → next(e))
  - `createProduct`: call `service.createProduct(req.user.user_id, req.body)`, respond 201
  - `getMyProducts`: call `service.getMyProducts(req.user.user_id)`, respond 200
  - `listProducts`: call `service.listProducts(req.query)`, respond 200
  - `getProductById`: call `service.getProductById(req.params.id)`, respond 200
  - `updateProduct`: call `service.updateProduct(req.params.id, req.user.user_id, req.body)`, respond 200
  - `deleteProduct`: call `service.deleteProduct(req.params.id, req.user.user_id)`, respond 200 with `{ message: 'Product deleted successfully' }`
  - `updateProductStatus`: call `service.updateProductStatus(req.params.id, req.body.status)`, respond 200
  - _Requirements: 1.1, 1.11, 2.1, 3.1, 4.1, 4.4, 5.1, 5.9, 6.1, 7.1, 7.8_

- [x] 5. Create `src/modules/product/router.js`
  - Define `validateUuidParam` inline helper (same pattern as user router)
  - Apply `router.use(authenticate)` for all routes
  - Declare routes in this exact order to prevent Express matching `my` as a UUID:
    1. `POST /` — `authorize('farmer')`, `validate(createProductSchema)`, `createProduct`
    2. `GET /my` — `authorize('farmer')`, `getMyProducts`
    3. `GET /` — `listProducts` (validate query inline with `listProductsQuerySchema`)
    4. `GET /:id` — `validateUuidParam`, `getProductById`
    5. `PATCH /:id/status` — `authorize('admin')`, `validateUuidParam`, `validate(updateStatusSchema)`, `updateProductStatus`
    6. `PATCH /:id` — `authorize('farmer')`, `validateUuidParam`, `validate(updateProductSchema)`, `updateProduct`
    7. `DELETE /:id` — `authorize('farmer')`, `validateUuidParam`, `deleteProduct`
  - Export router
  - _Requirements: 8.1–8.6, 9.1, 9.3_

  - [ ]* 5.1 Write property test for role guards and auth (Property 2, Property 15)
    - **Property 2: Role guards reject unauthorized roles**
    - **Property 15: Unauthenticated requests return 401**
    - **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 7.2, 8.1–8.5**

- [x] 6. Mount product router in `src/app.js`
  - Add `const productRouter = require('./modules/product/router');` with the other router imports
  - Add `app.use('/api/products', productRouter);` after the existing `app.use('/api/users', userRouter)` line
  - _Requirements: 9.2_

- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integration wiring and end-to-end tests
  - [ ] 8.1 Write unit tests covering happy paths and edge cases
    - Happy path for each endpoint (create, list, get by ID, update, delete, admin status update, get my products)
    - Edge cases: empty list returns `[]`, delete already-deleted product (400), update deleted product (400), GET by ID on deleted product (404)
    - Route ordering: confirm `GET /my` does not trigger UUID validation
    - Unverified user token returns 403
    - _Requirements: 1.1–1.11, 2.1–2.10, 3.1–3.7, 4.1–4.4, 5.1–5.9, 6.1–6.4, 7.1–7.8, 8.1–8.6_

  - [ ]* 8.2 Write property test for create round-trip (Property 1)
    - **Property 1: Create product round-trip**
    - **Validates: Requirements 1.1, 1.10, 1.11**

  - [ ]* 8.3 Write property test for admin status update round-trip (Property 13)
    - **Property 13: Admin status update round-trip**
    - **Validates: Requirements 7.1, 7.7, 7.8**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Route declaration order in task 5 is critical — `/my` and `/:id/status` must precede `/:id`
- Property tests use **fast-check** with a minimum of 100 iterations each
- Each property test must include a comment tag: `// Feature: product-module, Property <N>: <property_text>`
- No field stripping needed in product responses (unlike user module where `password_hash` is removed)
