# Last-Mile Delivery Tracker — System Design

## 1. Rate Calculation Engine
The rate engine calculates precise charges dynamically based on real-time database configuration rather than hardcoded coefficients. It handles volumetric pricing automatically using the following formula:
$$\text{volumetricWeight} = \frac{\text{Length} \times \text{Breadth} \times \text{Height}}{\text{volumetricDivisor}}$$
The chargeable weight is the maximum of the actual package weight and the calculated volumetric weight:
$$\text{chargeableWeight} = \max(\text{actualWeight}, \text{volumetricWeight})$$

Pricing retrieval resolves through order type (`B2B` or `B2C`) and geographical routing (`intra-zone` or `inter-zone`). If no active rate card exists in the database for the resolved combination, the operation fails explicitly to prevent incorrect pricing. The total cost is determined by applying the base rate, weight surcharges, and optional payment surcharges:
$$\text{baseCharge} = \max(\text{minCharge}, \text{baseRate} + (\text{chargeableWeight} - 1) \times \text{perKgRate})$$
$$\text{codSurcharge} = \text{codSurchargeFlat} + \frac{\text{baseCharge} \times \text{codSurchargePercent}}{100} \quad (\text{if COD, else 0})$$
$$\text{totalCharge} = \text{baseCharge} + \text{codSurcharge}$$

### Boundaries
The system performs static pricing based on the current active rate card snapshot at order creation. It does not support dynamic surge pricing, multi-currency routing, tax rates, or historical rate adjustments.

---

## 2. Zone Detection Approach
Zone detection maps physical addresses to internal dispatch boundaries. The system implements zone detection by mapping postal codes (pincodes) directly to zones:
$$\text{pincode} \xrightarrow{\text{lookup}} \text{Area} \xrightarrow{\text{reference}} \text{Zone}$$
When placing an order or requesting a quote, the system performs a database lookup on both the pickup and dropoff pincodes. It then references their respective zones to classify the routing as:
- **Intra-zone**: If $\text{Zone}_{\text{pickup}} = \text{Zone}_{\text{drop}}$
- **Inter-zone**: If $\text{Zone}_{\text{pickup}} \neq \text{Zone}_{\text{drop}}$

### Boundaries
This system relies entirely on predefined static pincode-to-zone mappings in the database. It does not utilize geocoding, polygon routing, GIS mapping, or coordinates to dynamically determine boundaries. Unregistered pincodes will result in order placement failure.

---

## 3. Auto-Assignment Logic
The auto-assignment service automatically matches newly placed orders to the most suitable delivery agent. The allocation flow operates as follows:
1. **Target Pool Selection**: Filters for agents with `status = 'available'` within the pickup zone.
2. **Workload Fallback**: If no agent is available in the pickup zone, it falls back to all `available` agents system-wide.
3. **Proximity Ranking**: If locations are available for both the pickup address and the candidate agents, candidates are ranked using the Haversine formula to compute distance:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
4. **Fairness-based Tiebreak**: If locations are absent, candidates are ranked by `activeOrderCount` ascending to balance the workload.
5. **Dispatch**: The top-ranked agent is assigned, their status transitions to `busy` if they reach maximum capacity, and a tracking event is written to log the assignment.

### Boundaries
Auto-assignment is a single-order-to-single-agent matching algorithm. It does not perform vehicle routing problems (VRP), multi-stop batching, route optimization, pooling, or traffic-aware travel time estimations.

---

## 4. Failed Delivery Handling
Failed deliveries initiate a structured rescheduling loop that ensures complete audit trail integrity. The process flows as follows:
```
OutForDelivery -> Failed -> Rescheduled -> Assigned -> PickedUp ...
```
1. **Failure Logging**: The agent updates the order status to `Failed` and inputs a reason (e.g., "customer unavailable"). This records a `TrackingEvent` and emails the customer.
2. **Rescheduling Form**: The customer receives a notification and uses the portal to select a `newDate` and state a `reason`, moving the status to `Rescheduled`.
3. **Re-assignment**: Saving the reschedule request automatically triggers the auto-assignment engine to find an available agent, updating the status back to `Assigned`.

### Boundaries
The system does not enforce a maximum reschedule limit, nor does it calculate optimized rescheduling windows. Return-to-origin (RTO) or warehouse restocking flows are out of scope.
