# Database Schema Documentation

This project uses **MongoDB** with **Mongoose** as the Object Document Mapper (ODM).

---

## Collections

### 1. Users (`users`)
Stores user accounts for Customers, Agents, and Administrators.
- `name` (String, required): Full name.
- `email` (String, required, unique, lowercase): Login email address.
- `passwordHash` (String, required): Bcrypt hashed password.
- `role` (String, enum: `['customer', 'agent', 'admin']`, default: `'customer'`): System access level.
- `phone` (String): Contact number.
- `addresses` (Array of Subdocuments): Saved addresses for customers.
  - `label` (String): e.g., "Home", "Work".
  - `line` (String): Street address.
  - `pincode` (String): Zip code.
- `refreshToken` (String): Saved JWT refresh token for session recovery.
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.

### 2. Zones (`zones`)
Defines macro delivery zones.
- `name` (String, required): e.g., "North Zone".
- `code` (String, required, unique, uppercase): e.g., "NORTH".
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.

### 3. Areas (`areas`)
Maps pincodes to Zones. This collection acts as the Zone Detection database.
- `pincode` (String, required, unique, indexed): The zip code.
- `city` (String, required): The corresponding city.
- `zoneId` (ObjectId, ref: `Zone`, required): The zone containing this pincode.
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.

### 4. RateCards (`ratecards`)
Stores rate cards containing coefficients for pricing.
- `orderType` (String, enum: `['B2B', 'B2C']`, required): The client segment.
- `rateType` (String, enum: `['intra-zone', 'inter-zone']`, required): Geographical classification.
- `baseRate` (Number, required): Cost for the first kg.
- `perKgRate` (Number, required): Additional charge per kg.
- `minCharge` (Number, required): Minimum pricing limit.
- `volumetricDivisor` (Number, default: `5000`): Divider for package dimensions.
- `codSurchargeFlat` (Number, default: `0`): Constant fee for COD.
- `codSurchargePercent` (Number, default: `0`): Variable fee percentage for COD.
- `isActive` (Boolean, default: `true`): Availability of the card.
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.
- *Indexes*: Compound index on `(orderType, rateType)`.

### 5. Agents (`agents`)
Extends the `User` schema to store delivery driver attributes.
- `userId` (ObjectId, ref: `User`, required, unique): Reference to the base user profile.
- `currentZoneId` (ObjectId, ref: `Zone`): Agent's current operating area.
- `currentLocation` (Subdocument):
  - `lat` (Number): Latitude coordinate.
  - `lng` (Number): Longitude coordinate.
- `status` (String, enum: `['available', 'busy', 'offline']`, default: `'available'`): Dispatch state.
- `activeOrderCount` (Number, default: `0`): Current delivery load count.
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.

### 6. Orders (`orders`)
The central document managing shipment lifecycle.
- `orderNumber` (String, required, unique, indexed): Human-readable tracking number (`ORD-YYYYMMDD-XXXXX`).
- `customerId` (ObjectId, ref: `User`, required, indexed): Recipient/owner customer.
- `createdBy` (ObjectId, ref: `User`, required): Creator of the order.
- `orderType` (String, enum: `['B2B', 'B2C']`, required).
- `paymentType` (String, enum: `['Prepaid', 'COD']`, required).
- `pickupAddress` / `dropAddress` (Subdocument):
  - `line` (String, required).
  - `pincode` (String, required).
  - `zoneId` (ObjectId, ref: `Zone`): Resolved via pincode at creation.
- `package` (Subdocument):
  - `length` / `breadth` / `height` / `actualWeight` (Number, required).
  - `volumetricWeight` / `chargeableWeight` (Number).
- `pricing` (Subdocument):
  - `baseCharge` (Number).
  - `codSurcharge` (Number).
  - `totalCharge` (Number).
  - `rateCardUsed` (ObjectId, ref: `RateCard`): Snapshot reference to card details.
- `status` (String, enum, default: `'Created'`): `['Created', 'Assigned', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'Cancelled']`.
- `assignedAgentId` (ObjectId, ref: `Agent`, indexed).
- `rescheduleHistory` (Array of Subdocuments):
  - `newDate` (Date, required).
  - `reason` (String).
  - `rescheduledAt` (Date, default: `Date.now`).
  - `rescheduledBy` (ObjectId, ref: `User`).
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.

### 7. TrackingEvents (`trackingevents`)
Append-only log of order lifecycle events.
- `orderId` (ObjectId, ref: `Order`, required, indexed): Affected order.
- `status` (String, required): Status reached in transition.
- `actor` (Subdocument):
  - `id` (ObjectId, ref: `User`): The user triggering the change.
  - `role` (String, enum: `['customer', 'agent', 'admin', 'system']`): Actor's security role.
- `note` (String): Context description (e.g., failure reasons, override details).
- `location` (Subdocument):
  - `lat` / `lng` (Number): Capture coordinates if updated via mobile device.
- `isOverride` (Boolean, default: `false`): Flag identifying administrative bypasses.
- `timestamp` (Date, default: `Date.now`): Exact action time.
- *Settings*: `timestamps: { createdAt: true, updatedAt: false }`.

### 8. Notifications (`notifications`)
Tracks communication history.
- `orderId` (ObjectId, ref: `Order`, required).
- `channel` (String, enum: `['email']`): Delivery channel.
- `recipient` (String, required): Email address.
- `subject` (String): Subject line.
- `status` (String, enum: `['sent', 'failed']`, required).
- `error` (String): Logged stack trace or message if sending failed.
- `sentAt` (Date, default: `Date.now`).
- `timestamps` (Mongoose default): `createdAt`, `updatedAt`.

---

## Append-Only Rationale: `TrackingEvent`

The `TrackingEvent` collection is designed as a write-only, immutable database log. It has no corresponding update (`PUT` / `PATCH`) or delete (`DELETE`) routes in the API.

> [!IMPORTANT]
> **Auditability & Regulatory Compliance**
> In supply chain management, audit logs are critical. Restricting updates or deletions to event logs prevents agents, users, or rogue admins from editing time logs or changing location metrics retroactively to hide late deliveries or cargo loss.
>
> **Debugging and Reconciliation**
> When billing errors occur, engineers and financial systems reference the chronological timeline of events. Having an immutable record guarantees that pricing calculations can always be matched against the exact status flow the parcel underwent.
