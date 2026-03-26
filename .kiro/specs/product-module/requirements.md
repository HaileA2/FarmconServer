# Requirements Document

## Introduction

The Product Module provides product lifecycle management for the FarmConnect platform. It exposes authenticated REST endpoints under `/api/products` that allow farmers to create, update, and soft-delete their own product listings, buyers and other authenticated users to browse active products with filtering, and admins to manage product status. The module follows the same 5-file structure (controller, service, repository, router, validation) established by the auth and user modules.

## Glossary

- **Product_Module**: The Express sub-application mounted at `/api/products` that handles all product listing and management operations.
- **Product_Service**: The business logic layer of the Product_Module.
- **Product_Repository**: The data access layer of the Product_Module that executes raw PostgreSQL queries via `query()` from `config/db`.
- **Product_Controller**: The HTTP handler layer of the Product_Module that delegates to Product_Service and forwards errors to `next(e)`.
- **Authenticated_User**: A caller who has presented a valid JWT and whose `is_verified` flag is `true`, resulting in `req.user = { user_id, role, is_verified }` being set by the `authenticate` middleware.
- **Farmer**: An Authenticated_User whose `role` is `farmer`.
- **Admin**: An Authenticated_User whose `role` is `admin`.
- **Product**: A row in the `products` table with fields: `product_id`, `farmer_id`, `title`, `description`, `price`, `quantity`, `category`, `location`, `status`, `created_at`, `updated_at`.
- **Active_Product**: A Product whose `status` is `active`.
- **Product_Status**: One of the three allowed values for the `status` column: `active`, `out_of_stock`, `deleted`.
- **Creatable_Fields**: The fields a Farmer may supply when creating a Product: `title`, `description`, `price`, `quantity`, `category`, `location`.
- **Updatable_Fields**: The fields a Farmer may supply when updating their own Product: `title`, `description`, `price`, `quantity`, `category`, `location`.
- **AppError**: The operational error class `AppError(message, statusCode)` used throughout the platform to signal expected error conditions.
- **Product_Filters**: Optional query parameters for listing products: `category`, `location`, `min_price`, `max_price`.

---

## Requirements

### Requirement 1: Create Product

**User Story:** As a farmer, I want to create a product listing, so that buyers can discover and purchase my produce.

#### Acceptance Criteria

1. WHEN a Farmer sends `POST /api/products` with a valid request body, THE Product_Controller SHALL return HTTP 201 with the created Product.
2. THE Product_Module SHALL reject `POST /api/products` requests from any Authenticated_User whose `role` is not `farmer` with HTTP 403.
3. THE Product_Module SHALL require `title`, `price`, `quantity`, and `category` in the request body; IF any required field is absent, THEN THE Product_Module SHALL return HTTP 400.
4. THE Product_Module SHALL validate `title` as a string between 3 and 255 characters.
5. THE Product_Module SHALL validate `description` as an optional string with a maximum length of 2000 characters.
6. THE Product_Module SHALL validate `price` as a number greater than or equal to `0`.
7. THE Product_Module SHALL validate `quantity` as an integer greater than or equal to `0`.
8. THE Product_Module SHALL validate `category` as a string between 2 and 100 characters.
9. THE Product_Module SHALL validate `location` as an optional string with a maximum length of 255 characters.
10. THE Product_Repository SHALL insert a new row into the `products` table with `farmer_id` set to `req.user.user_id` and `status` defaulting to `active`.
11. THE Product_Controller SHALL return the full Product object in the response body.

---

### Requirement 2: Update Own Product

**User Story:** As a farmer, I want to update my product listing, so that I can keep the details accurate.

#### Acceptance Criteria

1. WHEN a Farmer sends `PATCH /api/products/:id` with a valid request body, THE Product_Controller SHALL return HTTP 200 with the updated Product.
2. THE Product_Module SHALL reject `PATCH /api/products/:id` requests from any Authenticated_User whose `role` is not `farmer` with HTTP 403.
3. THE Product_Module SHALL validate that `:id` is a valid UUID; IF the format is invalid, THEN THE Product_Module SHALL return HTTP 400.
4. IF no Product exists for the given `:id`, THEN THE Product_Service SHALL throw an AppError with message `"Product not found"` and status code `404`.
5. IF the Product's `farmer_id` does not match `req.user.user_id`, THEN THE Product_Service SHALL throw an AppError with message `"Forbidden"` and status code `403`.
6. THE Product_Module SHALL accept only Updatable_Fields in the request body; all other fields SHALL be ignored.
7. THE Product_Module SHALL require at least one Updatable_Field to be present; IF none is provided, THEN THE Product_Module SHALL return HTTP 400.
8. THE Product_Module SHALL apply the same field-level validation rules as Requirement 1 for any Updatable_Field that is present.
9. THE Product_Repository SHALL update only the supplied Updatable_Fields and set `updated_at = NOW()` on the matching `products` row.
10. IF the Product's `status` is `deleted`, THEN THE Product_Service SHALL throw an AppError with message `"Cannot update a deleted product"` and status code `400`.

---

### Requirement 3: Soft-Delete Own Product

**User Story:** As a farmer, I want to remove a product listing, so that it no longer appears to buyers without permanently losing the record.

#### Acceptance Criteria

1. WHEN a Farmer sends `DELETE /api/products/:id`, THE Product_Controller SHALL return HTTP 200 with a success message.
2. THE Product_Module SHALL reject `DELETE /api/products/:id` requests from any Authenticated_User whose `role` is not `farmer` with HTTP 403.
3. THE Product_Module SHALL validate that `:id` is a valid UUID; IF the format is invalid, THEN THE Product_Module SHALL return HTTP 400.
4. IF no Product exists for the given `:id`, THEN THE Product_Service SHALL throw an AppError with message `"Product not found"` and status code `404`.
5. IF the Product's `farmer_id` does not match `req.user.user_id`, THEN THE Product_Service SHALL throw an AppError with message `"Forbidden"` and status code `403`.
6. THE Product_Repository SHALL set `status = 'deleted'` and `updated_at = NOW()` on the matching `products` row; THE Product_Repository SHALL NOT delete the row.
7. IF the Product's `status` is already `deleted`, THEN THE Product_Service SHALL throw an AppError with message `"Product is already deleted"` and status code `400`.

---

### Requirement 4: Get Own Products

**User Story:** As a farmer, I want to list all my product listings, so that I can manage my inventory.

#### Acceptance Criteria

1. WHEN a Farmer sends `GET /api/products/my`, THE Product_Controller SHALL return HTTP 200 with an array of Products belonging to the caller.
2. THE Product_Module SHALL reject `GET /api/products/my` requests from any Authenticated_User whose `role` is not `farmer` with HTTP 403.
3. THE Product_Repository SHALL retrieve all Products where `farmer_id = req.user.user_id`, including those with `status = 'deleted'`, ordered by `created_at DESC`.
4. WHEN no Products exist for the caller, THE Product_Controller SHALL return HTTP 200 with an empty array.

---

### Requirement 5: List Active Products

**User Story:** As an authenticated user, I want to browse all active product listings with optional filters, so that I can find produce that meets my needs.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends `GET /api/products`, THE Product_Controller SHALL return HTTP 200 with an array of Active_Products.
2. THE Product_Repository SHALL only return Products where `status = 'active'`.
3. THE Product_Repository SHALL return results ordered by `created_at DESC`.
4. WHEN the `category` query parameter is provided, THE Product_Repository SHALL filter results to Products whose `category` matches the provided value (case-insensitive).
5. WHEN the `location` query parameter is provided, THE Product_Repository SHALL filter results to Products whose `location` contains the provided value (case-insensitive partial match).
6. WHEN the `min_price` query parameter is provided, THE Product_Repository SHALL filter results to Products whose `price` is greater than or equal to `min_price`.
7. WHEN the `max_price` query parameter is provided, THE Product_Repository SHALL filter results to Products whose `price` is less than or equal to `max_price`.
8. THE Product_Module SHALL validate `min_price` and `max_price` as non-negative numbers when provided; IF invalid, THEN THE Product_Module SHALL return HTTP 400.
9. WHEN no Active_Products match the applied filters, THE Product_Controller SHALL return HTTP 200 with an empty array.

---

### Requirement 6: Get Single Product by ID

**User Story:** As an authenticated user, I want to retrieve a product by its ID, so that I can view its full details before placing an order.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends `GET /api/products/:id` with a valid UUID, THE Product_Controller SHALL return HTTP 200 with the matching Product.
2. THE Product_Module SHALL validate that `:id` is a valid UUID; IF the format is invalid, THEN THE Product_Module SHALL return HTTP 400.
3. IF no Product exists for the given `:id`, THEN THE Product_Service SHALL throw an AppError with message `"Product not found"` and status code `404`.
4. IF the Product's `status` is `deleted`, THEN THE Product_Service SHALL throw an AppError with message `"Product not found"` and status code `404`.

---

### Requirement 7: Admin — Update Product Status

**User Story:** As an admin, I want to set any product's status directly, so that I can moderate listings and resolve inventory issues.

#### Acceptance Criteria

1. WHEN an Admin sends `PATCH /api/products/:id/status` with a valid request body, THE Product_Controller SHALL return HTTP 200 with the updated Product.
2. THE Product_Module SHALL reject `PATCH /api/products/:id/status` requests from any Authenticated_User whose `role` is not `admin` with HTTP 403.
3. THE Product_Module SHALL validate that `:id` is a valid UUID; IF the format is invalid, THEN THE Product_Module SHALL return HTTP 400.
4. THE Product_Module SHALL require a `status` field in the request body; IF absent, THEN THE Product_Module SHALL return HTTP 400.
5. THE Product_Module SHALL validate `status` as one of `active`, `out_of_stock`, `deleted`; IF an invalid value is provided, THEN THE Product_Module SHALL return HTTP 400.
6. IF no Product exists for the given `:id`, THEN THE Product_Service SHALL throw an AppError with message `"Product not found"` and status code `404`.
7. THE Product_Repository SHALL update `status` and set `updated_at = NOW()` on the matching `products` row.
8. THE Product_Controller SHALL return the full updated Product object in the response body.

---

### Requirement 8: Authentication and Authorization Guards

**User Story:** As a platform operator, I want all product endpoints to enforce authentication and role-based access control, so that unauthorized callers cannot access or modify product data.

#### Acceptance Criteria

1. THE Product_Module SHALL apply the `authenticate` middleware to all routes under `/api/products`.
2. WHEN a request arrives without a valid JWT, THE Product_Module SHALL return HTTP 401.
3. WHEN a request arrives with a JWT belonging to an unverified account, THE Product_Module SHALL return HTTP 403.
4. THE Product_Module SHALL apply `authorize('farmer')` to `POST /api/products`, `PATCH /api/products/:id`, `DELETE /api/products/:id`, and `GET /api/products/my`.
5. THE Product_Module SHALL apply `authorize('admin')` to `PATCH /api/products/:id/status`.
6. THE Product_Module SHALL allow any Authenticated_User role to access `GET /api/products` and `GET /api/products/:id`.

---

### Requirement 9: Router Registration

**User Story:** As a backend developer, I want the product router mounted in `app.js`, so that all product endpoints are reachable under `/api/products`.

#### Acceptance Criteria

1. THE Product_Module SHALL export an Express Router from `src/modules/product/router.js`.
2. THE `app.js` SHALL mount the Product_Module router at the path `/api/products`.
3. THE `GET /api/products/my` route SHALL be defined before `GET /api/products/:id` in the router to prevent Express from matching `my` as a UUID parameter.
