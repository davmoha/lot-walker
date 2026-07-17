/**
 * Fuzzy-map raw CSV headers to canonical inventory field names.
 * Returns an object: { canonicalField: rawHeader }
 */
export function mapHeaders(rawHeaders) {
  const mapping = {};

  for (const header of rawHeaders) {
    const h = header.toLowerCase().trim();

    if (/vin|serial/.test(h)) {
      mapping.vin = header;
    } else if (/stock/.test(h)) {
      mapping.stock_number = header;
    } else if (/mileage|odo|odometer|miles/.test(h)) {
      mapping.mileage = header;
    } else if (/^make$|vehicle\s*make|mfr/.test(h)) {
      mapping.make = header;
    } else if (/^model$|vehicle\s*model/.test(h)) {
      mapping.model = header;
    } else if (/trim|style|series/.test(h)) {
      mapping.trim = header;
    } else if (/colou?r|ext(\.|erior)?\s*col/.test(h)) {
      mapping.color = header;
    } else if (/status|condition/.test(h)) {
      mapping.status = header;
    }
  }

  return mapping;
}

/**
 * Clean a single raw CSV row using the header mapping.
 * Returns a canonical inventory object ready for upsert.
 */
export function cleanRow(row, mapping) {
  const get = (field) => {
    const header = mapping[field];
    return header ? (row[header] || '').toString().trim() : '';
  };

  // VIN cleaning: strip spaces/dashes, convert letter O to 0, uppercase
  let vin = get('vin')
    .replace(/[\s\-]/g, '')
    .replace(/O/g, '0')
    .toUpperCase();

  const mileageRaw = get('mileage').replace(/[^0-9]/g, '');
  const mileage = mileageRaw ? parseInt(mileageRaw, 10) : 0;

  return {
    vin,
    stock_number: get('stock_number') || null,
    make: get('make') || null,
    model: get('model') || null,
    trim: get('trim') || null,
    color: get('color') || null,
    mileage,
    status: get('status') || null,
  };
}
