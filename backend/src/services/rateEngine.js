/**
 * Rate Calculation Engine
 *
 * Given an order payload, calculates the total delivery charge based on:
 *   1. Zone detection (pickup/drop pincode → zone via Area collection)
 *   2. Intra-zone vs inter-zone rate type
 *   3. Volumetric weight vs actual weight (chargeable = max of both)
 *   4. Active RateCard lookup for (orderType, rateType)
 *   5. COD surcharge if payment type is COD
 *
 * All numeric values (rates, divisors, surcharges) come from the database.
 * Nothing is hardcoded.
 */

import Area from '../models/Area.js';
import RateCard from '../models/RateCard.js';
import { round2 } from '../utils/helpers.js';

/**
 * Calculate delivery charge for an order.
 *
 * @param {Object} payload
 * @param {string} payload.pickupPincode
 * @param {string} payload.dropPincode
 * @param {string} payload.orderType - 'B2B' or 'B2C'
 * @param {string} payload.paymentType - 'Prepaid' or 'COD'
 * @param {number} payload.length - in cm
 * @param {number} payload.breadth - in cm
 * @param {number} payload.height - in cm
 * @param {number} payload.actualWeight - in kg
 *
 * @returns {Object} Full pricing breakdown
 */
export const calculateCharge = async ({
  pickupPincode,
  dropPincode,
  orderType,
  paymentType,
  length,
  breadth,
  height,
  actualWeight,
}) => {
  // Step 1: Look up pickup and drop zones via Area collection
  const pickupArea = await Area.findOne({ pincode: pickupPincode }).populate('zoneId');
  if (!pickupArea) {
    const err = new Error(`Pickup pincode ${pickupPincode} not found in service area`);
    err.statusCode = 400;
    throw err;
  }

  const dropArea = await Area.findOne({ pincode: dropPincode }).populate('zoneId');
  if (!dropArea) {
    const err = new Error(`Drop pincode ${dropPincode} not found in service area`);
    err.statusCode = 400;
    throw err;
  }

  const pickupZoneId = pickupArea.zoneId._id;
  const dropZoneId = dropArea.zoneId._id;

  // Step 2: Determine rate type
  const rateType = pickupZoneId.equals(dropZoneId) ? 'intra-zone' : 'inter-zone';

  // Step 5: Fetch the active RateCard for (orderType, rateType)
  // We fetch this before computing volumetric weight because we need the divisor from the card
  const rateCard = await RateCard.findOne({
    orderType,
    rateType,
    isActive: true,
  });

  if (!rateCard) {
    const err = new Error(
      `No active rate card found for orderType=${orderType}, rateType=${rateType}. ` +
        `An admin must create one before orders of this type can be priced.`
    );
    err.statusCode = 422;
    throw err;
  }

  // Step 3: Calculate volumetric weight using the rate card's divisor
  const volumetricWeight = round2((length * breadth * height) / rateCard.volumetricDivisor);

  // Step 4: Chargeable weight = max(actualWeight, volumetricWeight)
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // Step 6: Calculate base charge
  // baseCharge = max(minCharge, baseRate + (chargeableWeight - 1) * perKgRate)
  const calculatedCharge = rateCard.baseRate + (chargeableWeight - 1) * rateCard.perKgRate;
  const baseCharge = round2(Math.max(rateCard.minCharge, calculatedCharge));

  // Step 7: COD surcharge
  let codSurcharge = 0;
  if (paymentType === 'COD') {
    codSurcharge = round2(
      rateCard.codSurchargeFlat + (baseCharge * rateCard.codSurchargePercent) / 100
    );
  }

  // Step 8: Total charge
  const totalCharge = round2(baseCharge + codSurcharge);

  // Step 9: Return full breakdown
  return {
    pickupZoneId,
    dropZoneId,
    rateType,
    volumetricWeight,
    chargeableWeight,
    baseCharge,
    codSurcharge,
    totalCharge,
    rateCardUsed: rateCard._id,
    // Include rate card details for transparency in the quote
    rateCardDetails: {
      orderType: rateCard.orderType,
      rateType: rateCard.rateType,
      baseRate: rateCard.baseRate,
      perKgRate: rateCard.perKgRate,
      minCharge: rateCard.minCharge,
      volumetricDivisor: rateCard.volumetricDivisor,
      codSurchargeFlat: rateCard.codSurchargeFlat,
      codSurchargePercent: rateCard.codSurchargePercent,
    },
  };
};
