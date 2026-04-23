const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const STATE_ALIAS_MAP = {
    andhrapradesh: 'andhra pradesh',
    arunachalpradesh: 'arunachal pradesh',
    assam: 'assam',
    bihar: 'bihar',
    chhattisgarh: 'chhattisgarh',
    goa: 'goa',
    gujarat: 'gujarat',
    haryana: 'haryana',
    himachalpradesh: 'himachal pradesh',
    jharkhand: 'jharkhand',
    karnataka: 'karnataka',
    kerala: 'kerala',
    madhyapradesh: 'madhya pradesh',
    maharashtra: 'maharashtra',
    manipur: 'manipur',
    meghalaya: 'meghalaya',
    mizoram: 'mizoram',
    nagaland: 'nagaland',
    odisha: 'odisha',
    orissa: 'odisha',
    punjab: 'punjab',
    rajasthan: 'rajasthan',
    sikkim: 'sikkim',
    tamilnadu: 'tamil nadu',
    telangana: 'telangana',
    tripura: 'tripura',
    uttarpradesh: 'uttar pradesh',
    uttarakhand: 'uttarakhand',
    westbengal: 'west bengal',
    delhi: 'delhi',
    nctdelhi: 'delhi',
    jammukashmir: 'jammu and kashmir',
    ladakh: 'ladakh',
    puducherry: 'puducherry',
    chandigarh: 'chandigarh',
    andamannicobar: 'andaman and nicobar islands',
    dadranagarhaveli: 'dadra and nagar haveli and daman and diu',
    damandiu: 'dadra and nagar haveli and daman and diu',
    lakshadweep: 'lakshadweep',
    an: 'andaman and nicobar islands',
    ap: 'andhra pradesh',
    ar: 'arunachal pradesh',
    as: 'assam',
    br: 'bihar',
    cg: 'chhattisgarh',
    ga: 'goa',
    gj: 'gujarat',
    hr: 'haryana',
    hp: 'himachal pradesh',
    jh: 'jharkhand',
    ka: 'karnataka',
    kl: 'kerala',
    mp: 'madhya pradesh',
    mh: 'maharashtra',
    mn: 'manipur',
    ml: 'meghalaya',
    mz: 'mizoram',
    nl: 'nagaland',
    od: 'odisha',
    pb: 'punjab',
    rj: 'rajasthan',
    sk: 'sikkim',
    tn: 'tamil nadu',
    ts: 'telangana',
    tr: 'tripura',
    up: 'uttar pradesh',
    uk: 'uttarakhand',
    wb: 'west bengal',
    dl: 'delhi',
    jk: 'jammu and kashmir',
    la: 'ladakh',
    py: 'puducherry',
    ch: 'chandigarh',
    dn: 'dadra and nagar haveli and daman and diu',
    dd: 'dadra and nagar haveli and daman and diu',
    ld: 'lakshadweep'
};

const canonicalState = (value) => {
    const compact = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!compact) return '';
    for (const [alias, canonical] of Object.entries(STATE_ALIAS_MAP)) {
        if (compact.includes(alias)) return canonical;
    }
    return '';
};

const extractState = (stateLike) => {
    const raw = String(stateLike || '').trim();
    if (!raw) return '';
    const detected = canonicalState(raw);
    if (detected) return detected;
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    const likelyState = parts.length > 0 ? parts[parts.length - 1] : raw;
    const fromLastPart = canonicalState(likelyState);
    if (fromLastPart) return fromLastPart;
    return likelyState.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
};

export const isInterStateSupply = (clinicState, placeOfSupply) => {
    const clinic = extractState(clinicState);
    const supply = extractState(placeOfSupply);
    if (!clinic || !supply) return false;
    return clinic !== supply;
};

export const buildTaxSummary = ({ subtotal = 0, gstRate = 0, clinicState = '', placeOfSupply = '' }) => {
    const cleanSubtotal = round2(subtotal);
    const cleanRate = Math.max(0, toNumber(gstRate));
    const totalTax = round2((cleanSubtotal * cleanRate) / 100);
    const interstate = isInterStateSupply(clinicState, placeOfSupply);

    if (interstate) {
        return {
            subtotal: cleanSubtotal,
            gstRate: cleanRate,
            cgst: 0,
            sgst: 0,
            igst: totalTax,
            totalTax,
            grandTotal: round2(cleanSubtotal + totalTax),
            placeOfSupply: placeOfSupply || clinicState,
            clinicState,
            taxMode: 'IGST'
        };
    }

    const half = round2(totalTax / 2);
    return {
        subtotal: cleanSubtotal,
        gstRate: cleanRate,
        cgst: half,
        sgst: round2(totalTax - half),
        igst: 0,
        totalTax,
        grandTotal: round2(cleanSubtotal + totalTax),
        placeOfSupply: placeOfSupply || clinicState,
        clinicState,
        taxMode: 'CGST_SGST'
    };
};

export const buildLineTax = ({ quantity = 1, unitPrice = 0, gstRate = 0, clinicState = '', placeOfSupply = '' }) => {
    const qty = Math.max(0, toNumber(quantity, 1));
    const price = Math.max(0, toNumber(unitPrice));
    const subtotal = round2(qty * price);
    return {
        quantity: qty,
        unitPrice: round2(price),
        ...buildTaxSummary({ subtotal, gstRate, clinicState, placeOfSupply })
    };
};
