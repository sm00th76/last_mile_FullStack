# API Documentation

The server base path is `/api`. All protected routes expect a `Bearer` token in the `Authorization` header.

---

## Authentication Service

### 1. Register Customer Account
- **Endpoint**: `POST /auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "phone": "9876543210"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
  ```

### 2. Login User
- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK)**: (Same structure as registration)

### 3. Refresh Access Token
- **Endpoint**: `POST /auth/refresh`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOi..."
  }
  ```

---

## Order Management Service

### 1. Calculate Delivery Quote (Dry Run)
- **Endpoint**: `POST /orders/quote`
- **Access**: Customer, Admin
- **Request Body**:
  ```json
  {
    "pickupPincode": "110001",
    "dropPincode": "400001",
    "orderType": "B2C",
    "paymentType": "COD",
    "length": 10,
    "breadth": 15,
    "height": 20,
    "actualWeight": 2.5
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "quote": {
      "rateType": "inter-zone",
      "volumetricWeight": 0.6,
      "chargeableWeight": 2.5,
      "baseCharge": 117.5,
      "codSurcharge": 37.94,
      "totalCharge": 155.44,
      "rateCardDetails": { ... }
    }
  }
  ```

### 2. Place Order
- **Endpoint**: `POST /orders`
- **Access**: Customer, Admin (Admin can supply optional `customerId` parameter to place on behalf of customer)
- **Request Body**: (Same attributes as Quote, plus detailed address text)
  ```json
  {
    "orderType": "B2C",
    "paymentType": "Prepaid",
    "pickupAddress": {
      "line": "123 Delhi St",
      "pincode": "110001"
    },
    "dropAddress": {
      "line": "456 Mumbai Rd",
      "pincode": "400001"
    },
    "length": 10,
    "breadth": 15,
    "height": 20,
    "actualWeight": 2.5
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "order": {
      "_id": "60d0fe4f5311236168a109cb",
      "orderNumber": "ORD-20260714-48201",
      "status": "Assigned",
      "assignedAgentId": { ... },
      "pricing": { "totalCharge": 117.5, ... }
    }
  }
  ```

### 3. Get Active User's Orders
- **Endpoint**: `GET /orders/mine`
- **Access**: Customer (returns own orders), Agent (returns assigned orders)
- **Response (200 OK)**:
  ```json
  {
    "orders": [ ... ]
  }
  ```

### 4. Get Detailed Order Info
- **Endpoint**: `GET /orders/:id`
- **Access**: Customer (own), Agent (assigned), Admin (all)
- **Response (200 OK)**: `{ "order": { ... } }`

### 5. Get Tracking History (Timeline)
- **Endpoint**: `GET /orders/:id/tracking`
- **Access**: Customer (own), Agent (assigned), Admin (all)
- **Response (200 OK)**:
  ```json
  {
    "orderNumber": "ORD-20260714-48201",
    "currentStatus": "InTransit",
    "events": [
      {
        "status": "Created",
        "actor": { "role": "customer" },
        "note": "Order created",
        "timestamp": "2026-07-14T07:00:00.000Z"
      },
      {
        "status": "Assigned",
        "actor": { "role": "system" },
        "note": "Auto-assigned to agent",
        "timestamp": "2026-07-14T07:01:00.000Z"
      }
    ]
  }
  ```

### 6. Reschedule Failed Shipment
- **Endpoint**: `POST /orders/:id/reschedule`
- **Access**: Customer, Admin
- **Request Body**:
  ```json
  {
    "newDate": "2026-07-16T10:00:00Z",
    "reason": "Out of town"
  }
  ```
- **Response (200 OK)**: `{ "order": { ... } }` (Reschedules, resets status to `Rescheduled`, triggers auto-assignment to update status to `Assigned`).

### 7. Fetch All Orders (Filter & Paginate)
- **Endpoint**: `GET /orders`
- **Access**: Admin
- **Query Parameters**: `status`, `zoneId`, `agentId`, `page`, `limit`
- **Response (200 OK)**:
  ```json
  {
    "orders": [ ... ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
  ```

### 8. Update Shipment Status
- **Endpoint**: `PATCH /orders/:id/status`
- **Access**: Agent, Admin
- **Request Body**:
  ```json
  {
    "status": "PickedUp",
    "note": "Package size verified",
    "location": { "lat": 28.61, "lng": 77.2 }
  }
  ```
- **Response (200 OK)**: `{ "order": { ... }, "allowedTransitions": [...] }`

### 9. Force Status Override
- **Endpoint**: `PATCH /orders/:id/override`
- **Access**: Admin
- **Request Body**:
  ```json
  {
    "status": "Delivered",
    "note": "Manual override: customer confirmed via phone call"
  }
  ```
- **Response (200 OK)**: `{ "order": { ... } }`

---

## Administrative CRUD Routing (Admin Only)

- `GET /admin/zones` — List all zones.
- `POST /admin/zones` — Create a zone `{ "name": "East", "code": "EAST" }`.
- `PUT /admin/zones/:id` — Update zone settings.
- `DELETE /admin/zones/:id` — Remove zone (fails if areas are associated).

- `GET /admin/areas` — List all areas.
- `POST /admin/areas` — Create area mapping `{ "pincode": "700001", "city": "Kolkata", "zoneId": "..." }`.
- `PUT /admin/areas/:id` — Update area.
- `DELETE /admin/areas/:id` — Delete area mapping.

- `GET /admin/rate-cards` — List rate cards.
- `POST /admin/rate-cards` — Create card `{ "orderType", "rateType", "baseRate", "perKgRate", "minCharge", "volumetricDivisor", "codSurchargeFlat", "codSurchargePercent" }`.
- `PUT /admin/rate-cards/:id` — Update card parameters.
- `DELETE /admin/rate-cards/:id` — Delete card.

- `GET /admin/agents` — List delivery agents with locations and status.
- `POST /admin/agents` — Register agent `{ "userId": "...", "currentZoneId": "..." }`.
- `PUT /admin/agents/:id` — Modify agent settings.
- `PATCH /admin/agents/:id/status` — Toggle status `{ "status": "offline" }`.
- `DELETE /admin/agents/:id` — Delete agent profile.
