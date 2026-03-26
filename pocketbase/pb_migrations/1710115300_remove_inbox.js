/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("views");
        const existingField = collection.fields.getByName("is_inbox");
        if (existingField) {
            collection.fields.removeByName("is_inbox");
            app.save(collection);
        }
    } catch (err) {
        console.error("Migration 1710115300_remove_inbox failed:", err);
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("views");
        // Re-add is_inbox if rolling back
        collection.fields.add({
            name: "is_inbox",
            type: "bool"
        });
        app.save(collection);
    } catch (err) {
        console.error("Rollback 1710115300_remove_inbox failed:", err);
    }
})
