/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("items");
    collection.fields.add(new URLField({
        name: "favicon_url",
    }));
    app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("items");
    collection.fields.removeByName("favicon_url");
    app.save(collection);
})
