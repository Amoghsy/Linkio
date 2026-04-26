import test from "node:test";
import assert from "node:assert/strict";

import { extractSearchSignals } from "../src/ai/nlp.service.js";
import { applyWorkerSearch } from "../src/services/worker-search.utils.js";

test("extractSearchSignals parses useful filters from natural language", async () => {
    const signals = await extractSearchSignals(
        "Need an experienced electrician within 5 km under 900 who speaks Hindi"
    );

    assert.equal(signals.category, "electrician");
    assert.equal(signals.language, "hi");
    assert.equal(signals.maxDistanceKm, 5);
    assert.equal(signals.maxPrice, 900);
    assert.ok(signals.keywords.includes("electrician"));
});

test("extractSearchSignals marks urgent service requests", async () => {
    const signals = await extractSearchSignals("Painter needed immediately for one room");

    assert.equal(signals.category, "painter");
    assert.equal(signals.emergency, true);
});

test("applyWorkerSearch ranks the best worker for a sentence query", () => {
    const workers = [
        {
            id: "w1",
            name: "Ravi Electric Works",
            category: "electrician",
            skills: ["wiring", "fan install"],
            languages: ["hi", "en"],
            rating: 4.9,
            trustScore: 92,
            priceFrom: 800,
            availability: true,
            lat: 12.9716,
            lng: 77.5946,
        },
        {
            id: "w2",
            name: "Suresh Plumbing",
            category: "plumber",
            skills: ["pipe fitting"],
            languages: ["en"],
            rating: 4.8,
            trustScore: 95,
            priceFrom: 700,
            availability: true,
            lat: 12.972,
            lng: 77.6,
        },
    ];

    const results = applyWorkerSearch(workers, {
        rawQuery: "Need an electrician under 900 who speaks Hindi",
        category: "electrician",
        language: "hi",
        maxPrice: 900,
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].id, "w1");
});

test("applyWorkerSearch respects distance filters", () => {
    const workers = [
        {
            id: "nearby",
            name: "Nearby Electrician",
            category: "electrician",
            skills: ["wiring"],
            languages: ["en"],
            rating: 4.5,
            trustScore: 80,
            priceFrom: 600,
            availability: true,
            lat: 12.9716,
            lng: 77.5946,
        },
        {
            id: "far",
            name: "Far Electrician",
            category: "electrician",
            skills: ["wiring"],
            languages: ["en"],
            rating: 4.9,
            trustScore: 95,
            priceFrom: 600,
            availability: true,
            lat: 13.1,
            lng: 77.8,
        },
    ];

    const results = applyWorkerSearch(workers, {
        rawQuery: "electrician nearby",
        category: "electrician",
        lat: 12.9716,
        lng: 77.5946,
        radius: 3,
    });

    assert.deepEqual(results.map((worker) => worker.id), ["nearby"]);
});

test("applyWorkerSearch excludes workers from the wrong trade", () => {
    const workers = [
        {
            id: "electric-1",
            name: "Shiva Electricals",
            category: "electrician",
            skills: ["wiring", "switch board"],
            languages: ["en"],
            rating: 4.6,
            trustScore: 88,
            priceFrom: 700,
            availability: true,
            lat: 12.9716,
            lng: 77.5946,
        },
        {
            id: "plumber-1",
            name: "Ramesh Pipes",
            category: "plumber",
            skills: ["pipe fitting", "tap repair"],
            languages: ["en"],
            rating: 5,
            trustScore: 99,
            priceFrom: 500,
            availability: true,
            lat: 12.972,
            lng: 77.595,
        },
    ];

    const results = applyWorkerSearch(workers, {
        rawQuery: "I need an electrician for a wiring issue",
        category: "electrician",
        lat: 12.9716,
        lng: 77.5946,
        radius: 10,
    });

    assert.deepEqual(results.map((worker) => worker.id), ["electric-1"]);
});
