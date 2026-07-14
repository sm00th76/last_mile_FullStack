/**
 * Zone Detection Service
 *
 * Zone detection is implemented via the Area collection:
 *   pincode → Area → zoneId
 *
 * This is a simple lookup, not geocoding or polygon matching.
 */

import Area from '../models/Area.js';

/**
 * Look up the zone for a given pincode.
 * @param {string} pincode
 * @returns {Object} { zoneId, city, pincode } or throws if not found
 */
export const detectZone = async (pincode) => {
  const area = await Area.findOne({ pincode }).populate('zoneId');
  if (!area) {
    const err = new Error(`Pincode ${pincode} is not in any service area`);
    err.statusCode = 400;
    throw err;
  }
  return {
    zoneId: area.zoneId._id,
    zoneName: area.zoneId.name,
    zoneCode: area.zoneId.code,
    city: area.city,
    pincode: area.pincode,
  };
};
