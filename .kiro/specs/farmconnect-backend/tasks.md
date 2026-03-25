# Implementation Plan: FarmConnect Backend

## Overview

Incremental implementation starting with project scaffolding and shared infrastructure, then the auth module (priority), followed by all remaining feature modules. Each task builds on the previous and ends with everything wired together.

## Tasks

- [ ] 1. Project setup and shared infrastructure
  - [ ] 1.1 Initialize package.json and install dependencies
    - Create `package.json` with scripts: `start`, `dev`, `test`
    - Install: `express`, `pg`, `ioredis`, `jsonwebtoken`, `bcrypt`, `joi`, `uuid`, `express-rate-limit`, `helmet`, `cors`, `cookie-parser`, `dotenv`
    - Install dev: `jest`, `supertest`, `fast-check`, `nodemon`
    - Configure Jest in `package.json` with `testEnvironment: node`
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 1.2 Create environment config (`src/config/env.js`)
    - Read and validate all required env vars (DB, Redis, JWT, Bcrypt, Telebirr, Chapa, FCM, App)
    - Throw on startup if any required var is missing
    - Export a frozen config object
    - _Requirements: 9.7, 13.1_

  - [ ] 1.3 Create database connection pool (`src/config/db.js`)
    - Set up `pg.Pool` using config from `env.js`
    - Export `pool` and a `query(sql, params)` wrapper with slow-query logging (>500ms)
    - _Requirements: 13.6, 13.8_

  - [ ] 1.4 Create Redis client (`src/config/redis.js`)
    - Set up `ioredis` client using config from `env.js`
    - Handle connection errors gracefully (log, do not crash)
    - Export the client instance
    - _Requirements: 7.6, 10.3_

  - [ ] 1.5 Create database migration SQL file (`src/config/migrations/001_initial_schema.sql`)
    - Write `CREATE TABLE` statements for all 9 tables: `users`, `refresh_tokens`, `otps`, `products`, `orders`, `payments`, `notifications`, `delivery_assignments`, `market_price_history`, `search_history`
    - Include all indexes defined in the design doc
    - _Requirements: 6.1, 7.8, 8.1, 9.1, 11.1, 12.1_

  - [ ] 1.6 Create utility modules
    - `src/Utils/AppError.js`: custom error class with `message`, `statusCode`, `isOperational`
    - `src/Utils/logger.js`: structured logger (use `console` with JSON format; log level from env)
    - `src/Utils/jwt.js`: `signAccessToken`, `signRefreshToken`, `verifyToken`, `hashToken` (SHA-256)
    - `src/Utils/hash.js`: `hashPassword`, `comparePassword` using bcrypt
    - `src/Utils/otp.js`: `generateOtp()` returning a 6-digit numeric string
    - `src/Utils/cache.js`: `get`, `set`, `del`, `delByPattern` wrapping ioredis
    - _Requirements: 1.4, 2.1, 2.4, 3.1_

  - [ ]* 1.7 Write property tests for utility functions
    - **Property 1: Password hashing is irreversible and consistent** — for any plaintext, `hashPassword` then `comparePassword` returns true, and hash !== plaintext
    - **Property 3: JWT access token round trip** — for any `{ user_id, role }` payload, sign then verify returns equivalent payload
    - **Property 4: Expired tokens are rejected** — for any payload signed with past expiry, `verifyToken` always throws
    - **Validates: Requirements 1.4, 2.1, 2.4, 4.4**

  - [ ] 1.8 Create shared middleware
    - `src/middlewares/requestId.js`: attach `uuid v4` as `req.id`, set `X-Request-Id` header
    - `src/middlewares/errorHandler.js`: central error handler — returns `{ status, message, requestId }`, hides stack in production
    - `src/middlewares/validate.js`: `validate(schema)` factory using Joi, `abortEarly: false`, throws `AppError(400)`
    - `src/middlewares/authenticate.js`: reads Bearer token or `access_token` cookie, calls `verifyToken`, attaches `req.user`, throws 401/403
    - `src/middlewares/authorize.js`: `authorize(...roles)` factory, checks `req.user.role`, throws `AppError(403)`
    - `src/middlewares/rateLimiter.js`: export `authLimiter` (100/15min/IP) and `apiLimiter` (1000/15min/user)
    - _Requirements: 4.1, 4.4, 4.5, 13.2, 13.3, 13.4, 13.5_

  - [ ] 1.9 Bootstrap Express app (`src/app.js`)
    - Register middleware in order: `requestId`, `helmet` (with security headers), `cors`, `cookieParser`, `express.json`
    - Apply `apiLimiter` globally to `/api`
    - Register module routers (stubs for now — will be filled in subsequent tasks)
    - Register `errorHandler` as last middleware
    - Register `unhandledRejection` and `uncaughtException` handlers
    - Export `app`; create `src/server.js` as entry point that calls `app.listen`
    - _Requirements: 13.1, 13.4, 13.7_

- [ ] 2. Auth module
  - [ ] 2.1 Implement auth repository (`src/modules/auth/repository.js`)
    - `findByEmail(email)` — parameterized query on `users`
    - `findByEmailOrPhone(email, phone)` — check for duplicates
    - `findById(user_id)` — fetch user by PK
    - `createUser(userData)` — insert into `users`, return `{ user_id, role }`
    - `setVerified(user_id)` — set `is_verified = true`
    - `createOtp(user_id, otp_code, expires_at)` — insert into `otps`
    - `findLatestOtp(user_id)` — fetch latest unused OTP for user
    - `markOtpUsed(otp_id)` — set `used = true`
    - `invalidatePreviousOtps(user_id)` — set `used = true` for all existing OTPs
    - `storeRefreshToken(user_id, token_hash, expires_at)` — insert into `refresh_tokens`
    - `findRefreshToken(token_hash)` — fetch by hash, check not expired
    - `deleteRefreshToken(token_hash)` — delete row
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.7, 3.1, 3.4, 13.6_

  - [ ] 2.2 Implement auth service (`src/modules/auth/service.js`)
    - `register(data)`: validate uniqueness → hash password → createUser → generateOtp → createOtp → (stub) sendOtp → return `{ user_id, role }`; handle OTP failure with `202` path
    - `login(email, password)`: findByEmail → comparePassword → signAccessToken → signRefreshToken → hashToken → storeRefreshToken → return tokens
    - `refreshToken(rawToken)`: hashToken → findRefreshToken → check expiry → signAccessToken → return `{ accessToken }`
    - `logout(rawToken)`: hashToken → deleteRefreshToken
    - `verifyOtp(user_id, otp)`: findLatestOtp → check expiry (410) → check code (400) → markOtpUsed → setVerified
    - `resendOtp(user_id)`: findById → invalidatePreviousOtps → generateOtp → createOtp → (stub) sendOtp
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 2.3 Write property tests for auth service — OTP properties
    - **Property 5: OTP expiry enforcement** — for any OTP with `expires_at` in the past, `verifyOtp` returns 410 and `is_verified` stays false
    - **Property 6: OTP resend invalidates previous OTP** — after `resendOtp`, the old OTP code is unusable and only the new one verifies
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 2.4 Write property tests for auth service — duplicate registration
    - **Property 2: Duplicate email/phone registration is rejected** — for any existing user, re-registering with same email or phone returns 409 and user count is unchanged
    - **Validates: Requirements 1.2**

  - [ ] 2.5 Implement auth validation schemas (`src/modules/auth/validation.js`)
    - `registerSchema`: `name` (string, required), `email` (email, required), `phone` (string, required), `password` (min 8, required), `role` (enum: farmer/buyer/transporter, required)
    - `loginSchema`: `email` (email, required), `password` (string, required)
    - `verifyOtpSchema`: `user_id` (uuid, required), `otp` (6-digit string, required)
    - `resendOtpSchema`: `user_id` (uuid, required)
    - `refreshSchema`: `refreshToken` (string, optional — may come from cookie)
    - _Requirements: 1.3, 13.5_

  - [ ] 2.6 Implement auth controller (`src/modules/auth/controller.js`)
    - `register`: call `authService.register`, set cookies if tokens returned, respond 201
    - `login`: call `authService.login`, set `access_token` and `refresh_token` httpOnly cookies, respond 200
    - `refresh`: read token from body or cookie, call `authService.refreshToken`, respond 200
    - `logout`: read token from body or cookie, call `authService.logout`, clear cookies, respond 200
    - `verifyOtp`: call `authService.verifyOtp`, respond 200
    - `resendOtp`: call `authService.resendOtp`, respond 200
    - _Requirements: 1.1, 2.1, 2.7, 3.1, 3.4_

  - [ ] 2.7 Implement auth router (`src/modules/auth/router.js`)
    - Mount `authLimiter` on all auth routes
    - `POST /register` → `validate(registerSchema)`, `register`
    - `POST /login` → `validate(loginSchema)`, `login`
    - `POST /refresh` → `refresh`
    - `POST /logout` → `authenticate`, `logout`
    - `POST /verify-otp` → `validate(verifyOtpSchema)`, `verifyOtp`
    - `POST /resend-otp` → `validate(resendOtpSchema)`, `resendOtp`
    - Wire router into `app.js` at `/api/auth`
    - _Requirements: 1.1, 2.1, 2.5, 2.7, 3.1, 3.4_

  - [ ]* 2.8 Write integration tests for auth endpoints
    - Test register: 201 on valid input, 409 on duplicate, 400 on missing fields
    - Test login: 200 + tokens on valid creds, 401 on bad email, 401 on bad password
    - Test refresh: 200 on valid token, 401 on expired/invalid
    - Test logout: 200 and token invalidated
    - Test verify-otp: 200 on valid, 410 on expired, 400 on wrong code
    - Test resend-otp: 200 and old OTP invalidated
    - _Requirements: 1.1–1.6, 2.1–2.7, 3.1–3.5_

  - [ ]* 2.9 Write property tests for RBAC and unverified user blocking
    - **Property 7: RBAC role enforcement** — for any protected endpoint requiring role R, a request with any other role returns 403
    - **Property 8: Unverified users are blocked** — for any request where `is_verified = false`, protected endpoints return 403
    - **Validates: Requirements 3.5, 4.2, 4.3**

  - [ ] 2.10 Checkpoint — auth module complete
    - Ensure all auth tests pass, ask the user if questions arise.

- [ ] 3. User module (`src/modules/user/`)
  - [ ] 3.1 Implement user repository
    - `findById(user_id)` — return user excluding `password_hash`
    - `updateUser(user_id, fields)` — PATCH allowed fields (name, phone, location, fcm_token); reject `role` changes
    - `listUsers({ page, limit })` — paginated query with total count
    - `softDeleteUser(user_id)` — set `is_active = false`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 3.2 Implement user service and controller
    - Service: `getMe`, `updateMe` (block role field → 403), `getUserById`, `listUsers`, `deleteUser`
    - Controller: map service results to HTTP responses
    - Validation schemas: `updateMeSchema` (optional name, phone, location, fcm_token)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 3.3 Implement user router and wire into app
    - `GET /me` → `authenticate`, `getMe`
    - `PATCH /me` → `authenticate`, `validate(updateMeSchema)`, `updateMe`
    - `GET /:id` → `authenticate`, `authorize('admin')`, `getUserById`
    - `GET /` → `authenticate`, `authorize('admin')`, `listUsers`
    - `DELETE /:id` → `authenticate`, `authorize('admin')`, `deleteUser`
    - Wire at `/api/users`
    - _Requirements: 5.1–5.6_

  - [ ]* 3.4 Write property test for paginated list stability
    - **Property 14: Paginated list endpoints are stable** — union of all pages equals full unpaginated result with no duplicates or omissions
    - **Validates: Requirements 5.5**

- [ ] 4. Product module (`src/modules/product/`)
  - [ ] 4.1 Implement product repository
    - `createProduct(data)` — insert, return product
    - `findById(product_id)` — single product
    - `updateProduct(product_id, fields)` — PATCH; auto-set `status = out_of_stock` when `quantity = 0`
    - `softDeleteProduct(product_id)` — set `status = deleted`
    - `listProducts({ search, category, minPrice, maxPrice, location, page, limit })` — filtered paginated query using parameterized SQL
    - _Requirements: 6.1–6.6, 7.1–7.5, 7.8, 13.6_

  - [ ] 4.2 Implement product service with cache integration
    - `createProduct`: insert → `cache.delByPattern('farmconnect:products:list:*')` → return
    - `updateProduct`: ownership check (403) → update → invalidate product cache + list cache
    - `deleteProduct`: ownership or admin check → soft delete → invalidate caches
    - `listProducts`: build cache key from query params → `cache.get` → if miss, query DB → `cache.set(key, result, 300)`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 7.1–7.7_

  - [ ] 4.3 Implement product validation, controller, and router
    - Schemas: `createProductSchema`, `updateProductSchema`, `listProductsQuerySchema`
    - Controller: map service to HTTP responses
    - Router: `GET /` (optional auth), `POST /` (farmer), `PATCH /:id` (farmer), `DELETE /:id` (farmer, admin)
    - Wire at `/api/products`
    - _Requirements: 6.1–6.6, 7.1–7.5, 13.5_

  - [ ]* 4.4 Write property tests for product module
    - **Property 12: Product listing cache consistency** — after create/update/delete, cache for affected query is invalidated and next read reflects the change
    - **Property 13: Parameterized queries prevent SQL injection** — any string with SQL metacharacters passed to `listProducts` does not alter query structure
    - **Property 14: Paginated list stability** — union of all pages equals full unpaginated result (product listing)
    - **Validates: Requirements 6.6, 7.1, 7.6, 13.6**

- [ ] 5. Order module (`src/modules/order/`)
  - [ ] 5.1 Implement order repository
    - `createOrder(data)` — insert order + decrement product quantity in a single transaction
    - `findById(order_id)` — join with product and buyer
    - `listOrders({ buyer_id?, farmer_id?, page, limit })` — role-scoped query
    - `updateOrderStatus(order_id, status)` — update with `updated_at`
    - `checkProductStock(product_id, quantity)` — return product row with FOR UPDATE lock
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 13.6_

  - [ ] 5.2 Implement order service
    - `placeOrder(buyer_id, product_id, quantity)`: stock check (409 if insufficient) → createOrder in transaction → trigger notification stub
    - `updateStatus(order_id, newStatus, actor)`: validate transition against allowed map → updateOrderStatus → trigger notification stub
    - Valid transitions: `Pending→Confirmed`, `Confirmed→Processing`, `Processing→Shipped`, `Shipped→Delivered`, `Pending→Cancelled`, `Pending→Failed`
    - _Requirements: 8.1–8.8_

  - [ ]* 5.3 Write property tests for order module
    - **Property 9: Order creation decrements product quantity atomically** — for quantity Q and order N (N ≤ Q), after order: product.quantity = Q - N and total_amount = N × price
    - **Property 10: Insufficient stock orders are rejected** — for N > Q, order rejected with 409 and product.quantity remains Q
    - **Property 11: Invalid order status transitions are rejected** — for any status S, transition to unreachable status returns 422 and status stays S
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

  - [ ] 5.4 Implement order validation, controller, and router
    - Schemas: `placeOrderSchema`, `updateStatusSchema`
    - Controller: map service to HTTP responses
    - Router: `POST /` (buyer), `GET /` (buyer, farmer, admin), `GET /:id`, `PATCH /:id/status` (farmer, admin)
    - Wire at `/api/orders`
    - _Requirements: 8.1–8.8_

- [ ] 6. Payment module (`src/modules/payment/`)
  - [ ] 6.1 Implement payment repository
    - `createPayment(data)` — insert payment record
    - `findById(payment_id)` — return payment with order info
    - `findByGatewayRef(gateway_ref)` — lookup by gateway reference
    - `updatePaymentStatus(payment_id, status, transaction_ref?)` — update status
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6_

  - [ ] 6.2 Implement payment service
    - `initiatePayment(buyer_id, order_id, method)`: create payment record → call gateway stub (return mock redirect URL) → return URL
    - `handleWebhook(gateway, payload, signature)`: verify signature (400 if invalid) → findByGatewayRef → update status → if success: update order to Confirmed; if failed: update order to Failed
    - `getPayment(payment_id, requester)`: ownership or admin check → return record
    - All gateway credentials read exclusively from env vars, never logged
    - _Requirements: 9.1–9.7_

  - [ ] 6.3 Implement payment validation, controller, and router
    - Schemas: `initiatePaymentSchema`
    - Controller: map service to HTTP responses
    - Router: `POST /initiate` (buyer), `POST /webhook/:gateway` (no auth), `GET /:payment_id` (buyer, admin)
    - Wire at `/api/payments`
    - _Requirements: 9.1–9.7_

- [ ] 7. Notification module (`src/modules/notification/`)
  - [ ] 7.1 Implement notification repository and service
    - Repository: `createNotification(user_id, type, message)`, `listNotifications(user_id, { page, limit })`, `markRead(notification_id, user_id)`, `markAllRead(user_id)`
    - Service: `notify(user_id, type, message)` — createNotification + optional FCM push (log failure, do not throw); `listNotifications`, `markRead`, `markAllRead`
    - _Requirements: 11.1–11.7_

  - [ ]* 7.2 Write property test for notification creation
    - **Property 15: Notification creation on order status change** — for any order status transition, notifications are created for both buyer and farmer with non-empty message and correct `user_id`
    - **Validates: Requirements 8.8, 11.1**

  - [ ] 7.3 Implement notification validation, controller, and router
    - Controller: `listNotifications`, `markRead`, `markAllRead`
    - Router: `GET /` (any), `PATCH /:id/read` (any), `PATCH /read-all` (any)
    - Wire at `/api/notifications`
    - _Requirements: 11.3–11.5_

  - [ ] 7.4 Wire notification service into order and payment services
    - In `order/service.js`: call `notificationService.notify` after status change for buyer and farmer
    - In `payment/service.js`: call `notificationService.notify` after payment status change for buyer
    - _Requirements: 8.8, 11.1, 11.2_

- [ ] 8. Transport module (`src/modules/transport/`)
  - [ ] 8.1 Implement transport repository, service, controller, and router
    - Repository: `createAssignment(order_id, transporter_id)`, `updateStatus(assignment_id, status)`, `listByTransporter(transporter_id)`, `findById(assignment_id)`
    - Service: `assignDelivery`, `updateDeliveryStatus` (on Delivered → call order service to set order Delivered), `getMyDeliveries`
    - Router: `POST /assign` (admin), `PATCH /:assignment_id/status` (transporter), `GET /my-deliveries` (transporter)
    - Wire at `/api/transport`
    - _Requirements: 12.1–12.4_

- [ ] 9. Analytics module (`src/modules/analytics/`)
  - [ ] 9.1 Implement analytics repository and service
    - Repository: `getCurrentPrices(category)` — aggregate query on `products`; `getPriceHistory(category, from, to)` — query `market_price_history`; `getAdminDashboard()`, `getFarmerDashboard(farmer_id)`, `getBuyerDashboard(buyer_id)`
    - Service: wrap each with Redis cache (TTL 10 min for prices, no cache for dashboard)
    - _Requirements: 10.1–10.6_

  - [ ] 9.2 Implement analytics controller and router
    - Controller: `getMarketPrices`, `getPriceHistory`, `getDashboard` (role-branched)
    - Router: `GET /market-prices` (any), `GET /market-prices/history` (any), `GET /dashboard` (admin, farmer, buyer)
    - Wire at `/api/analytics`
    - _Requirements: 10.1–10.6_

- [ ] 10. Final integration and wiring
  - [ ] 10.1 Ensure all module routers are registered in `app.js`
    - Verify `/api/auth`, `/api/users`, `/api/products`, `/api/orders`, `/api/payments`, `/api/notifications`, `/api/transport`, `/api/analytics` are all mounted
    - Confirm `errorHandler` is the last middleware
    - _Requirements: 13.4_

  - [ ]* 10.2 Write end-to-end integration tests for cross-module flows
    - Test: register → verify OTP → login → create product → place order → initiate payment → webhook → check notification
    - Test: assign transport → update to Delivered → verify order status updated
    - _Requirements: 8.3, 8.8, 9.4, 11.1, 12.3_

  - [ ] 10.3 Final checkpoint — all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Auth module (task 2) is the implementation priority — complete before moving to other modules
- Property tests use `fast-check` with minimum 100 runs per property
- Each property test references its property number and requirement clause from the design doc
- The migration SQL file (task 1.5) must be run against PostgreSQL before starting the server
- All gateway credentials (Telebirr, Chapa) must be in env vars only — never hardcoded or logged
