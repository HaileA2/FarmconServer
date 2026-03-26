# Requirements Document
## Introduction

FarmConnect is a digital agricultural marketplace backend built with Node.js/Express and PostgreSQL. It exposes a RESTful API that connects farmers, buyers, administrators, and transporters. The backend handles user authentication, product management, order processing, payment integration (Telebirr and Chapa), market analytics, and notifications. All requirements below are backend/API-level only.
---
## Glossary
- **Auth_Service**: The authentication and authorization module responsible for registration, login, token issuance, and RBAC enforcement.
- **User_Service**: The user profile management module.
- **Product_Service**: The module responsible for product listing, inventory, and search.
- **Order_Service**: The module responsible for order lifecycle management.
- **Payment_Service**: The module responsible for payment initiation, verification, and reconciliation with external gateways.
- **Notification_Service**: The module responsible for sending and managing in-app and push notifications.
- **Analytics_Service**: The module responsible for market price data aggregation and dashboard metrics.
- **Transport_Service**: The module responsible for delivery assignment and tracking.
- **Repository**: The data-access layer that abstracts all direct database queries.
- **JWT**: JSON Web Token used for stateless authentication.
- **OTP**: One-Time Password used for phone/email verification.
- **RBAC**: Role-Based Access Control — restricts API access based on user role (farmer, buyer, admin, transporter).
- **Farmer**: A registered user with role `farmer` who lists and manages agricultural products.
- **Buyer**: A registered user with role `buyer` who browses products and places orders.
- **Admin**: A registered user with role `admin` who manages users and platform content.
- **Transporter**: A registered user with role `transporter` who handles deliveries.
- **Telebirr**: An Ethiopian mobile money payment gateway integrated for payment processing.
- **Chapa**: An Ethiopian fintech payment gateway integrated for payment processing.
- **Redis_Cache**: An in-memory cache layer used to store frequently accessed data such as product listings and market prices.
- **FCM**: Firebase Cloud Messaging service used for push notification delivery.

---

- **FCM**: Firebase Cloud Messaging service used for push notification delivery.
- **Recommendation_Service**: The module responsible for computing and serving personalized product recommendations to buyers using rule-based weighted scoring across order history, search history, and product popularity signals.

### Requirement 1: User Registration

**User Story:** As a new user (farmer, buyer, or transporter), I want to register an account, so that I can access the FarmConnect platform with the appropriate role.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/register` with valid `name`, `email`, `phone`, `password`, and `role` fields, THE Auth_Service SHALL create a new user record and return a `201 Created` response with the user's `user_id` and `role`.
2. WHEN a registration request is received with an `email` or `phone` that already exists in the database, THE Auth_Service SHALL return a `409 Conflict` response with a descriptive error message.
3. WHEN a registration request is received with a missing required field, THE Auth_Service SHALL return a `400 Bad Request` response listing the missing fields.
4. THE Auth_Service SHALL hash the user's password using bcrypt with a minimum cost factor of 10 before persisting it to the database.
5. WHEN a user registers with role `farmer` or `buyer`, THE Auth_Service SHALL send an OTP to the provided `phone` or `email` for account verification.
6. IF the OTP delivery fails, THEN THE Auth_Service SHALL return a `202 Accepted` response indicating the account was created but verification is pending, and SHALL log the failure.

---

### Requirement 2: User Authentication

**User Story:** As a registered user, I want to log in with my credentials, so that I can receive a JWT and access protected API endpoints.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with valid `email` and `password`, THE Auth_Service SHALL return a `200 OK` response containing a signed JWT access token and a refresh token.
2. WHEN a login request is made with an unrecognized `email`, THE Auth_Service SHALL return a `401 Unauthorized` response.
3. WHEN a login request is made with an incorrect `password`, THE Auth_Service SHALL return a `401 Unauthorized` response without revealing whether the email or password was wrong.
4. THE Auth_Service SHALL sign JWT access tokens with an expiry of 15 minutes and refresh tokens with an expiry of 7 days.
5. WHEN a POST request is made to `/api/auth/refresh` with a valid refresh token, THE Auth_Service SHALL return a new access token.
6. IF a refresh token is expired or invalid, THEN THE Auth_Service SHALL return a `401 Unauthorized` response.
7. WHEN a POST request is made to `/api/auth/logout`, THE Auth_Service SHALL invalidate the refresh token and return a `200 OK` response.

---

### Requirement 3: OTP Verification

**User Story:** As a newly registered user, I want to verify my account via OTP, so that the platform can confirm my identity.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/verify-otp` with a valid `user_id` and matching `otp`, THE Auth_Service SHALL mark the user's account as verified and return a `200 OK` response.
2. WHEN an OTP verification request is made with an expired OTP (older than 10 minutes), THE Auth_Service SHALL return a `410 Gone` response.
3. WHEN an OTP verification request is made with an incorrect OTP, THE Auth_Service SHALL return a `400 Bad Request` response.
4. WHEN a POST request is made to `/api/auth/resend-otp` for an unverified account, THE Auth_Service SHALL generate a new OTP, invalidate the previous one, and send it to the user's registered contact.
5. WHILE a user account is unverified, THE Auth_Service SHALL reject requests to protected endpoints with a `403 Forbidden` response indicating verification is required.

---

### Requirement 4: Role-Based Access Control

**User Story:** As a platform operator, I want API endpoints to enforce role-based access, so that users can only perform actions permitted by their role.

#### Acceptance Criteria

1. THE Auth_Service SHALL attach the authenticated user's `user_id` and `role` to every validated request context.
2. WHEN a request is made to a farmer-only endpoint (e.g., product creation) by a user with role `buyer`, THE Auth_Service SHALL return a `403 Forbidden` response.
3. WHEN a request is made to an admin-only endpoint by a non-admin user, THE Auth_Service SHALL return a `403 Forbidden` response.
4. THE Auth_Service SHALL validate the JWT signature and expiry on every protected route before passing the request to the controller.
5. IF a JWT is malformed or its signature is invalid, THEN THE Auth_Service SHALL return a `401 Unauthorized` response.

---

### Requirement 5: User Profile Management

**User Story:** As a registered user, I want to view and update my profile, so that my account information stays current.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/users/me` with a valid JWT, THE User_Service SHALL return the authenticated user's profile data excluding the password field.
2. WHEN a PATCH request is made to `/api/users/me` with valid updated fields, THE User_Service SHALL update the user record and return the updated profile.
3. WHEN a PATCH request is made to `/api/users/me` with an attempt to change the `role` field, THE User_Service SHALL return a `403 Forbidden` response.
4. WHEN a GET request is made to `/api/users/:id` by an admin, THE User_Service SHALL return the target user's profile.
5. WHEN a GET request is made to `/api/users` by an admin, THE User_Service SHALL return a paginated list of all users with `page` and `limit` query parameters supported.
6. WHEN a DELETE request is made to `/api/users/:id` by an admin, THE User_Service SHALL soft-delete the user record and return a `200 OK` response.

---

### Requirement 6: Product Listing and Management

**User Story:** As a farmer, I want to create, update, and delete product listings, so that buyers can discover and purchase my agricultural products.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/products` by an authenticated farmer with valid `title`, `description`, `price`, `quantity`, and `category` fields, THE Product_Service SHALL create a product record linked to the farmer's `user_id` and return a `201 Created` response.
2. WHEN a PATCH request is made to `/api/products/:id` by the farmer who owns the product, THE Product_Service SHALL update the specified fields and return the updated product.
3. WHEN a PATCH request is made to `/api/products/:id` by a user who does not own the product, THE Product_Service SHALL return a `403 Forbidden` response.
4. WHEN a DELETE request is made to `/api/products/:id` by the owning farmer or an admin, THE Product_Service SHALL soft-delete the product and return a `200 OK` response.
5. WHEN a product's `quantity` is updated to `0`, THE Product_Service SHALL automatically set the product `status` to `out_of_stock`.
6. THE Product_Service SHALL invalidate the Redis_Cache entry for the affected product listing upon any create, update, or delete operation.

---

### Requirement 7: Product Search and Filtering

**User Story:** As a buyer, I want to search and filter products by keyword, category, price range, and location, so that I can find relevant agricultural products efficiently.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/products` with no query parameters, THE Product_Service SHALL return a paginated list of active products with default `page=1` and `limit=20`.
2. WHEN a GET request is made to `/api/products?search=<keyword>`, THE Product_Service SHALL return products whose `title` or `description` contains the keyword (case-insensitive).
3. WHEN a GET request is made to `/api/products?category=<category>`, THE Product_Service SHALL return only products matching the specified category.
4. WHEN a GET request is made to `/api/products?minPrice=<n>&maxPrice=<m>`, THE Product_Service SHALL return only products with `price` within the specified range.
5. WHEN a GET request is made to `/api/products?location=<location>`, THE Product_Service SHALL return products associated with the specified location.
6. THE Product_Service SHALL serve product listing responses from Redis_Cache when a cached result exists for the given query parameters.
7. WHILE a Redis_Cache entry for a product query is valid, THE Product_Service SHALL return the cached response within 50ms.
8. THE Repository SHALL maintain a PostgreSQL index on `products.category`, `products.price`, and `products.status` to support efficient filtering queries.

---

### Requirement 8: Order Placement and Processing

**User Story:** As a buyer, I want to place an order for a product, so that I can purchase agricultural goods from farmers.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/orders` by an authenticated buyer with valid `product_id` and `quantity`, THE Order_Service SHALL create an order record with status `Pending` and return a `201 Created` response with the `order_id` and `total_amount`.
2. WHEN an order is placed for a product with insufficient `quantity`, THE Order_Service SHALL return a `409 Conflict` response indicating insufficient stock.
3. WHEN an order is created, THE Order_Service SHALL decrement the product's available `quantity` by the ordered amount within the same database transaction.
4. WHEN a PATCH request is made to `/api/orders/:id/status` by the selling farmer or an admin with a valid status transition, THE Order_Service SHALL update the order status and return the updated order.
5. IF an invalid status transition is requested (e.g., `Delivered` → `Pending`), THEN THE Order_Service SHALL return a `422 Unprocessable Entity` response.
6. WHEN a GET request is made to `/api/orders` by a buyer, THE Order_Service SHALL return only orders belonging to that buyer.
7. WHEN a GET request is made to `/api/orders` by a farmer, THE Order_Service SHALL return only orders for products owned by that farmer.
8. WHEN an order status changes, THE Order_Service SHALL trigger the Notification_Service to send a status update notification to the relevant buyer and farmer.

---

### Requirement 9: Payment Processing

**User Story:** As a buyer, I want to pay for my order using Telebirr or Chapa, so that the transaction is securely processed and the order is confirmed.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/payments/initiate` with a valid `order_id` and `payment_method` (`telebirr` or `chapa`), THE Payment_Service SHALL initiate a payment session with the selected gateway and return a `200 OK` response containing the gateway's redirect URL or payment token.
2. WHEN the selected payment gateway sends a webhook callback to `/api/payments/webhook/:gateway`, THE Payment_Service SHALL verify the webhook signature and update the corresponding payment record's `payment_status`.
3. IF the webhook signature verification fails, THEN THE Payment_Service SHALL return a `400 Bad Request` response and log the invalid callback attempt.
4. WHEN a payment is confirmed as successful by the gateway, THE Payment_Service SHALL update the associated order status to `Confirmed` and record the `transaction_ref`.
5. WHEN a payment fails or is rejected by the gateway, THE Payment_Service SHALL update the payment `payment_status` to `failed` and the order status to `Failed`.
6. WHEN a GET request is made to `/api/payments/:payment_id` by the buyer who owns the order or an admin, THE Payment_Service SHALL return the payment record details.
7. THE Payment_Service SHALL store all gateway credentials (API keys, secrets) exclusively in environment variables and SHALL NOT log or expose them in responses.

---

### Requirement 10: Market Price Analytics

**User Story:** As a farmer or buyer, I want to view current and historical market prices for agricultural products, so that I can make informed buying and selling decisions.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/analytics/market-prices?category=<category>`, THE Analytics_Service SHALL return the average, minimum, and maximum listed price for active products in that category.
2. WHEN a GET request is made to `/api/analytics/market-prices/history?category=<category>&from=<date>&to=<date>`, THE Analytics_Service SHALL return aggregated daily average prices for the specified category and date range.
3. THE Analytics_Service SHALL serve market price responses from Redis_Cache when a cached result exists, with a cache TTL of 10 minutes.
4. WHEN a GET request is made to `/api/analytics/dashboard` by an admin, THE Analytics_Service SHALL return platform-level metrics including total users, total orders, total revenue, and active product count.
5. WHEN a GET request is made to `/api/analytics/dashboard` by a farmer, THE Analytics_Service SHALL return farmer-specific metrics including total listings, total orders received, and total revenue earned.
6. WHEN a GET request is made to `/api/analytics/dashboard` by a buyer, THE Analytics_Service SHALL return buyer-specific metrics including total orders placed and total amount spent.

---

### Requirement 11: Notification and Alert Services

**User Story:** As a user, I want to receive notifications about order updates, payment confirmations, and platform alerts, so that I stay informed about activity relevant to me.

#### Acceptance Criteria

1. WHEN an order status changes, THE Notification_Service SHALL create a notification record in the database for the affected buyer and farmer with the appropriate `type` and `message`.
2. WHEN a payment status changes, THE Notification_Service SHALL create a notification record for the affected buyer.
3. WHEN a GET request is made to `/api/notifications` by an authenticated user, THE Notification_Service SHALL return a paginated list of that user's notifications ordered by `created_at` descending.
4. WHEN a PATCH request is made to `/api/notifications/:id/read` by the notification's owner, THE Notification_Service SHALL set `is_read` to `true` and return a `200 OK` response.
5. WHEN a PATCH request is made to `/api/notifications/read-all` by an authenticated user, THE Notification_Service SHALL mark all of that user's unread notifications as read.
6. WHERE FCM integration is configured, THE Notification_Service SHALL send a push notification to the user's registered device token in addition to creating the database record.
7. IF FCM delivery fails, THEN THE Notification_Service SHALL log the failure and continue without returning an error to the caller.

---

### Requirement 12: Transport and Delivery Management

**User Story:** As a transporter, I want to be assigned deliveries and update delivery status, so that orders can be tracked through the logistics process.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/transport/assign` by an admin with a valid `order_id` and `transporter_id`, THE Transport_Service SHALL create a delivery assignment record and return a `201 Created` response.
2. WHEN a PATCH request is made to `/api/transport/:assignment_id/status` by the assigned transporter with a valid status value, THE Transport_Service SHALL update the delivery status and return the updated assignment.
3. WHEN a delivery status is updated to `Delivered`, THE Transport_Service SHALL trigger the Order_Service to update the associated order status to `Delivered`.
4. WHEN a GET request is made to `/api/transport/my-deliveries` by an authenticated transporter, THE Transport_Service SHALL return all delivery assignments for that transporter.

---

### Requirement 13: API Security and Non-Functional Requirements

**User Story:** As a platform operator, I want the API to meet security and performance standards, so that user data is protected and the system remains reliable under load.

#### Acceptance Criteria

1. THE Auth_Service SHALL enforce HTTPS for all API endpoints by rejecting plain HTTP requests in production.
2. THE Auth_Service SHALL apply rate limiting of 100 requests per 15-minute window per IP address on all authentication endpoints.
3. THE Auth_Service SHALL apply rate limiting of 1000 requests per 15-minute window per authenticated user on all other protected endpoints.
4. WHEN any unhandled error occurs, THE System SHALL return a structured JSON error response with `status`, `message`, and `requestId` fields, and SHALL NOT expose stack traces in production.
5. THE System SHALL validate all incoming request bodies against defined schemas before passing them to the controller layer, returning `400 Bad Request` for any schema violation.
6. THE Repository SHALL use parameterized queries for all database interactions to prevent SQL injection.
7. THE System SHALL include `X-Content-Type-Options`, `X-Frame-Options`, and `Strict-Transport-Security` headers in all responses.
8. WHEN a database query for a paginated list endpoint exceeds 500ms, THE Repository SHALL log a slow-query warning including the query identifier and duration.
9. THE Product_Service SHALL respond to product listing requests within 200ms for cached results and within 800ms for uncached results under normal load.
10. THE System SHALL support horizontal scaling by maintaining no server-side session state, relying exclusively on JWT and Redis for session and cache management.

---

### Requirement 14: AI Product Recommendation System

**User Story:** As a buyer, I want to receive personalized product recommendations based on my search history, previous orders, and platform-wide popularity, so that I can discover relevant agricultural products without manually searching.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/recommendations` by an authenticated buyer, THE Recommendation_Service SHALL return a list of up to 10 recommended products ordered by relevance score descending.
2. THE Recommendation_Service SHALL compute relevance scores using a rule-based weighted algorithm combining three signals:
   - **Order history signal**: products in the same category as the buyer's previously ordered products (weight: 0.5)
   - **Search history signal**: products matching keywords from the buyer's recent search queries (weight: 0.3)
   - **Popularity signal**: products with the highest order count platform-wide in the last 30 days (weight: 0.2)
3. WHEN a buyer has no order history and no search history, THE Recommendation_Service SHALL fall back to returning the top 10 most-ordered products platform-wide in the last 30 days.
4. THE Recommendation_Service SHALL exclude products that are `out_of_stock` or soft-deleted from all recommendation results.
5. THE Recommendation_Service SHALL exclude products the buyer has already ordered from recommendation results.
6. WHEN a buyer performs a product search via `/api/products?search=<keyword>`, THE Recommendation_Service SHALL record the search keyword against the buyer's `user_id` in a `search_history` table with a `searched_at` timestamp.
7. THE Recommendation_Service SHALL only consider search history entries from the last 30 days when computing the search history signal.
8. THE Recommendation_Service SHALL cache recommendation results per buyer in Redis_Cache with a TTL of 30 minutes.
9. WHEN a buyer places a new order or performs a new search, THE Recommendation_Service SHALL invalidate that buyer's cached recommendation result.
10. WHEN a GET request is made to `/api/analytics/dashboard` by a buyer, THE Analytics_Service SHALL include a `recommended_products` field in the response containing the output of the Recommendation_Service for that buyer.
11. THE Repository SHALL maintain a `search_history` table with columns: `id` (PK), `user_id` (FK), `keyword` (VARCHAR 255), `searched_at` (TIMESTAMP).
12. THE Repository SHALL maintain a `product_popularity` view or materialized query that aggregates order counts per product over a rolling 30-day window to support the popularity signal.
