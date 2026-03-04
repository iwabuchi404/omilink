/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 0. Cleanup Old Collections (Drop & Recreate)
    const oldNames = ["placements", "view_items", "views", "items", "bookmarks", "categories", "tags"];
    for (const name of oldNames) {
        try {
            const c = app.findCollectionByNameOrId(name);
            if (c) app.delete(c);
        } catch (e) { }
    }

    const createCollection = (name, customFields, listRule = "@request.auth.id != '' && user = @request.auth.id") => {
        const fields = [
            { name: "id", type: "text", primaryKey: true, required: true, system: true, autogeneratePattern: "[a-z0-9]{15}", pattern: "^[a-z0-9]+$" },
            { name: "user", type: "relation", required: true, collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 },
            ...customFields,
            { name: "created", type: "autodate", onCreate: true, onUpdate: false },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
        ];

        const collection = new Collection({
            name: name,
            type: "base",
            fields: fields,
            listRule: listRule,
            viewRule: listRule,
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != '' && user = @request.auth.id",
            deleteRule: "@request.auth.id != '' && user = @request.auth.id"
        });

        try {
            app.save(collection);
            return collection;
        } catch (err) {
            console.log(`Error creating ${name}:`, err);
            throw err;
        }
    };

    // 1. Tags
    const tags = createCollection("tags", [
        { name: "name", type: "text", required: true }
    ]);

    // 2. Items
    const items = createCollection("items", [
        { name: "type", type: "text", required: true }, // "bookmark" | "memo"
        { name: "url", type: "url", required: false },
        { name: "title", type: "text" },
        { name: "description", type: "text" },
        { name: "og_image_url", type: "url" },
        { name: "memo", type: "text" },
        { name: "tags", type: "relation", collectionId: tags.id, maxSelect: null },
        { name: "is_public", type: "bool" },
        { name: "is_deleted", type: "bool" },
        { name: "deleted_at", type: "date" },
        { name: "ogp_fetched", type: "bool" }
    ], "@request.auth.id != '' && (user = @request.auth.id || is_public = true)");

    // 3. Views
    const views = createCollection("views", [
        { name: "name", type: "text", required: true },
        { name: "cols", type: "number", required: true },
        { name: "cell_size", type: "text", required: true },
        { name: "is_inbox", type: "bool" }
    ]);

    // 4. Placements
    createCollection("placements", [
        { name: "view", type: "relation", required: true, collectionId: views.id, cascadeDelete: true, maxSelect: 1 },
        { name: "item", type: "relation", required: true, collectionId: items.id, cascadeDelete: true, maxSelect: 1 },
        { name: "col", type: "number", required: false },
        { name: "row", type: "number", required: false },
        { name: "width", type: "number", required: false },
        { name: "height", type: "number", required: false }
    ]);
}, (app) => {
    const names = ["placements", "views", "items", "tags"];
    for (const name of names) {
        try {
            const c = app.findCollectionByNameOrId(name);
            app.delete(c);
        } catch (e) { }
    }
})
