import { db } from "./src/config/firebase.js";

async function approveWorkers() {
    console.log("Approving all workers...");
    const snapshot = await db.collection("workers").get();
    
    let count = 0;
    const batch = db.batch();
    
    snapshot.forEach(doc => {
        batch.update(doc.ref, {
            verified: true,
            priceApproved: true
        });
        count++;
    });
    
    await batch.commit();
    console.log(`Approved ${count} workers.`);
    process.exit(0);
}

approveWorkers().catch(console.error);
