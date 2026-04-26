const CATEGORY_SYNONYMS = new Map([
    ["plumber", "plumber"],
    ["plumbing", "plumber"],
    ["pipe fitting", "plumber"],
    ["pipefitting", "plumber"],
    ["pipe leaking", "plumber"],
    ["electrician", "electrician"],
    ["electrical", "electrician"],
    ["wiring", "electrician"],
    ["fan not working", "electrician"],
    ["carpenter", "carpenter"],
    ["carpentry", "carpenter"],
    ["woodwork", "carpenter"],
    ["ac repair", "ac repair"],
    ["ac technician", "ac repair"],
    ["ac service", "ac repair"],
    ["ac servicing", "ac repair"],
    ["air conditioner", "ac repair"],
    ["air conditioning", "ac repair"],
    ["hvac", "ac repair"],
    ["cleaner", "cleaner"],
    ["cleaning", "cleaner"],
    ["house cleaning", "cleaner"],
    ["painter", "painter"],
    ["painting", "painter"],
    ["gardener", "gardener"],
    ["gardening", "gardener"],
    ["appliance", "appliance"],
    ["appliance repair", "appliance"],
    ["emergency worker", "emergency worker"],
    ["emergency", "emergency worker"],
    ["urgent", "emergency worker"],
]);

const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "at",
    "by",
    "for",
    "from",
    "i",
    "in",
    "is",
    "me",
    "my",
    "near",
    "need",
    "of",
    "on",
    "or",
    "please",
    "someone",
    "the",
    "to",
    "with",
]);

export const toNumber = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeText = (value) =>
    typeof value === "string"
        ? value
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
        : "";

export const normalizeCategory = (value) => {
    const text = normalizeText(value);
    if (!text) return "";

    // Exact matches or synonym map
    if (CATEGORY_SYNONYMS.has(text)) return CATEGORY_SYNONYMS.get(text);

    // Fuzzy keyword mapping
    if (text.includes("plumb") || text.includes("pipe") || text.includes("leak")) return "plumber";
    if (text.includes("electric") || text.includes("fan") || text.includes("wire")) return "electrician";
    if (text.includes("carpent") || text.includes("wood")) return "carpenter";
    if (text.includes("ac ") || text.includes("air") || text.includes("hvac")) return "ac repair";
    if (text.includes("paint")) return "painter";
    if (text.includes("clean")) return "cleaner";
    if (text.includes("garden")) return "gardener";
    if (text.includes("appliance")) return "appliance";
    if (text.includes("emergency") || text.includes("urgent")) return "emergency worker";

    return text;
};

export const normalizeStringArray = (value) =>
    Array.isArray(value)
        ? value
            .filter((item) => typeof item === "string" && item.trim())
            .map((item) => normalizeText(item))
            .filter(Boolean)
        : [];

export const parseBoolean = (value) => value === true || value === "true";

export const isWorkerAvailable = (worker) => worker.availability ?? worker.available ?? true;

export const normalizeLocationLabel = (value) =>
    typeof value === "string" ? value.trim() : "";

export const normalizeLocationFields = (data = {}) => {
    const normalized = { ...data };

    // Support Firestore Admin SDK GeoPoint ({ latitude, longitude }),
    // plain objects ({ lat, lng }), and top-level lat/lng fields.
    const rawLoc = data.location;
    const lat = toNumber(
        rawLoc?.latitude ?? rawLoc?.lat ?? data.lat
    );
    const lng = toNumber(
        rawLoc?.longitude ?? rawLoc?.lng ?? data.lng
    );

    if (lat !== null && lng !== null && !(lat === 0 && lng === 0)) {
        normalized.lat = lat;
        normalized.lng = lng;
        normalized.location = { lat, lng };
    } else if ("lat" in data || "lng" in data || "location" in data) {
        delete normalized.lat;
        delete normalized.lng;
        normalized.location = null;
    }

    const locationLabel = normalizeLocationLabel(data.locationLabel);
    if (locationLabel) {
        normalized.locationLabel = locationLabel;
    } else if ("locationLabel" in data) {
        delete normalized.locationLabel;
    }

    return normalized;
};

export const getWorkerLatLng = (worker) => {
    // Handle all three storage shapes:
    //  1. Firestore Admin SDK GeoPoint  → { latitude, longitude }
    //  2. Plain object                  → { lat, lng }
    //  3. Top-level fields              → worker.lat / worker.lng
    const rawLoc = worker.location;
    const lat = toNumber(
        rawLoc?.latitude ?? rawLoc?.lat ?? worker.lat
    );
    const lng = toNumber(
        rawLoc?.longitude ?? rawLoc?.lng ?? worker.lng
    );

    if (lat === null || lng === null) return null;

    // (0, 0) is a Firestore placeholder — not a real worker location.
    if (lat === 0 && lng === 0) return null;

    return { lat, lng };
};

export const isWorkerSearchable = (worker) => {
    if (worker?.verified === false || worker?.priceApproved === false) {
        return false;
    }
    const category = normalizeCategory(worker?.category);
    const skills = normalizeStringArray(worker?.skills);
    return Boolean(category || skills.length > 0);
};

export const calculateDistanceKm = (originLat, originLng, destinationLat, destinationLng) => {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(destinationLat - originLat);
    const dLng = toRad(destinationLng - originLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(originLat)) *
            Math.cos(toRad(destinationLat)) *
            Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const splitQueryTerms = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return [];

    return normalized
        .split(/[^a-z0-9]+/i)
        .map((term) => term.trim())
        .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
};

const buildWorkerSearchText = (worker) => {
    const parts = [
        worker.name,
        worker.category,
        ...(Array.isArray(worker.skills) ? worker.skills : []),
        worker.bio,
        ...(Array.isArray(worker.languages) ? worker.languages : []),
    ];

    return normalizeText(parts.filter(Boolean).join(" "));
};

const matchesServiceIntent = (worker, criteria) => {
    const searchable = buildWorkerSearchText(worker);
    const normalizedCategory = normalizeCategory(worker.category);
    const normalizedSkills = normalizeStringArray(worker.skills);
    const serviceTerms = Array.from(
        new Set(
            [
                criteria.category,
                criteria.skill,
                ...(Array.isArray(criteria.keywords) ? criteria.keywords : []),
            ]
                .map(normalizeCategory)
                .filter(Boolean)
        )
    );

    const requestedServiceTerms = serviceTerms.filter((term) =>
        CATEGORY_SYNONYMS.has(term) || Array.from(CATEGORY_SYNONYMS.values()).includes(term)
    );

    if (requestedServiceTerms.length === 0) {
        return true;
    }

    return requestedServiceTerms.some(
        (term) =>
            normalizedCategory === term ||
            normalizedSkills.includes(term) ||
            searchable.includes(term)
    );
};

const scoreWorker = (worker, criteria) => {
    const searchable = buildWorkerSearchText(worker);
    const normalizedCategory = normalizeCategory(worker.category);
    const normalizedSkills = normalizeStringArray(worker.skills);
    const normalizedLanguages = normalizeStringArray(worker.languages);
    const normalizedName = normalizeText(worker.name);

    let score = 0;

    if (criteria.workerName && normalizedName.includes(criteria.workerName)) {
        score += 140;
    }

    if (criteria.category) {
        if (normalizedCategory === criteria.category) {
            score += 120;
        } else if (normalizedSkills.includes(criteria.category) || searchable.includes(criteria.category)) {
            score += 70;
        }
    }

    if (criteria.skill) {
        if (normalizedSkills.includes(criteria.skill)) {
            score += 100;
        } else if (searchable.includes(criteria.skill)) {
            score += 55;
        }
    }

    for (const keyword of criteria.keywords) {
        if (searchable.includes(keyword)) {
            score += 18;
        }
    }

    if (criteria.rawQuery && searchable.includes(criteria.rawQuery)) {
        score += 36;
    }

    if (criteria.language && normalizedLanguages.includes(criteria.language)) {
        score += 25;
    }

    if (criteria.emergency && isWorkerAvailable(worker)) {
        score += 12;
    }

    score += Number(worker.rating ?? 0) * 4;
    score += Number(worker.trustScore ?? 0) / 12;

    if (!isWorkerAvailable(worker)) {
        score -= 1000;
    }

    return score;
};

export const applyWorkerSearch = (workers, criteria = {}) => {
    const normalizedCriteria = {
        rawQuery: normalizeText(criteria.rawQuery),
        category: normalizeCategory(criteria.category),
        skill: normalizeCategory(criteria.skill),
        language: normalizeCategory(criteria.language),
        workerName: normalizeText(criteria.workerName),
        keywords: Array.from(
            new Set(
                [
                    ...splitQueryTerms(criteria.rawQuery),
                    ...(Array.isArray(criteria.keywords) ? criteria.keywords : []).map(normalizeCategory),
                ].filter(Boolean)
            )
        ),
        emergency: Boolean(criteria.emergency),
        minRating: toNumber(criteria.minRating),
        maxPrice: toNumber(criteria.maxPrice),
        originLat: toNumber(criteria.lat),
        originLng: toNumber(criteria.lng),
        radiusKm: toNumber(criteria.radius),
    };

    let filtered = workers.map((worker) => {
        const coords = getWorkerLatLng(worker);
        const next = {
            ...worker,
            category: normalizeCategory(worker.category),
            skills: normalizeStringArray(worker.skills),
            languages: normalizeStringArray(worker.languages),
            availability: isWorkerAvailable(worker),
            available: isWorkerAvailable(worker),
            lat: coords?.lat ?? worker.lat ?? 0,
            lng: coords?.lng ?? worker.lng ?? 0,
            distanceKm: worker.distanceKm ?? 0,
        };

        if (
            normalizedCriteria.originLat !== null &&
            normalizedCriteria.originLng !== null &&
            normalizedCriteria.radiusKm !== null &&
            normalizedCriteria.radiusKm > 0 &&
            coords
        ) {
            const distanceKm = calculateDistanceKm(
                normalizedCriteria.originLat,
                normalizedCriteria.originLng,
                coords.lat,
                coords.lng
            );
            next.distanceKm = Number(distanceKm.toFixed(1));
        }

        return next;
    });

    filtered = filtered.filter((worker) => isWorkerAvailable(worker));

    if (normalizedCriteria.category || normalizedCriteria.skill || normalizedCriteria.keywords.length > 0) {
        filtered = filtered.filter((worker) => matchesServiceIntent(worker, normalizedCriteria));
    }

    if (normalizedCriteria.language) {
        filtered = filtered.filter((worker) => worker.languages.includes(normalizedCriteria.language));
    }

    if (normalizedCriteria.minRating !== null && normalizedCriteria.minRating > 0) {
        filtered = filtered.filter((worker) => Number(worker.rating ?? 0) >= normalizedCriteria.minRating);
    }

    if (normalizedCriteria.maxPrice !== null && normalizedCriteria.maxPrice > 0) {
        filtered = filtered.filter((worker) => Number(worker.priceFrom ?? 0) <= normalizedCriteria.maxPrice);
    }

    if (
        normalizedCriteria.originLat !== null &&
        normalizedCriteria.originLng !== null &&
        normalizedCriteria.radiusKm !== null &&
        normalizedCriteria.radiusKm > 0
    ) {
        filtered = filtered.filter((worker) => {
            const coords = getWorkerLatLng(worker);
            if (!coords) return false;
            return Number(worker.distanceKm ?? Infinity) <= normalizedCriteria.radiusKm;
        });
    } else if (
        normalizedCriteria.originLat !== null &&
        normalizedCriteria.originLng !== null
    ) {
        filtered = filtered
            .map((worker) => {
                const coords = getWorkerLatLng(worker);
                if (!coords) {
                    return { ...worker, distanceKm: Number.POSITIVE_INFINITY };
                }

                const distanceKm = calculateDistanceKm(
                    normalizedCriteria.originLat,
                    normalizedCriteria.originLng,
                    coords.lat,
                    coords.lng
                );

                return {
                    ...worker,
                    distanceKm: Number(distanceKm.toFixed(1)),
                };
            })
            .filter((worker) => Number.isFinite(worker.distanceKm));
    }

    const hasSearchIntent =
        Boolean(normalizedCriteria.rawQuery) ||
        Boolean(normalizedCriteria.category) ||
        Boolean(normalizedCriteria.skill) ||
        normalizedCriteria.keywords.length > 0 ||
        Boolean(normalizedCriteria.workerName);

    const scored = filtered.map((worker) => ({
        worker,
        score: scoreWorker(worker, normalizedCriteria),
    }));

    const matched = hasSearchIntent
        ? scored.filter(({ score }) => score > 0)
        : scored;

    return matched
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (Number(b.worker.rating ?? 0) !== Number(a.worker.rating ?? 0)) {
                return Number(b.worker.rating ?? 0) - Number(a.worker.rating ?? 0);
            }
            return Number(a.worker.distanceKm ?? 0) - Number(b.worker.distanceKm ?? 0);
        })
        .map(({ worker }) => worker);
};
