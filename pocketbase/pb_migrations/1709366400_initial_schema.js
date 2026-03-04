/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const createCollection = (name, customFields, listRule = "user = @request.auth.id") => {
    const fields = [
      // Primary Key must be required: true, system: true and define autogeneratePattern for PB v0.23 auto-generation
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
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id"
    });

    app.save(collection);
    return collection;
  };

  // 1. Categories
  const categories = createCollection("categories", [
    { name: "name", type: "text", required: true },
    { name: "color", type: "text" }
  ]);

  // 2. Tags
  const tags = createCollection("tags", [
    { name: "name", type: "text", required: true }
  ]);

  // 3. Bookmarks
  const bookmarks = createCollection("bookmarks", [
    { name: "url", type: "text", required: false },
    { name: "title", type: "text" },
    { name: "description", type: "text" },
    { name: "og_image_url", type: "text" },
    { name: "category", type: "relation", collectionId: categories.id, maxSelect: 1 },
    { name: "tags", type: "relation", collectionId: tags.id },
    { name: "memo", type: "text" },
    { name: "is_public", type: "bool" },
    { name: "ogp_fetched", type: "bool" }
  ], "user = @request.auth.id || is_public = true");

  // 4. Views
  const views = createCollection("views", [
    { name: "name", type: "text", required: true },
    { name: "icon", type: "text" }
  ]);

  // 5. View Items
  const viewItems = createCollection("view_items", [
    { name: "view", type: "relation", required: true, collectionId: views.id, cascadeDelete: true, maxSelect: 1 },
    { name: "bookmark", type: "relation", required: true, collectionId: bookmarks.id, cascadeDelete: true, maxSelect: 1 },
    { name: "x", type: "number", required: false },
    { name: "y", type: "number", required: false },
    { name: "w", type: "number", required: true },
    { name: "h", type: "number", required: true },
    { name: "color", type: "text" }
  ]);

}, (app) => {
  const names = ["view_items", "views", "bookmarks", "tags", "categories"];
  for (const name of names) {
    try {
      const c = app.findCollectionByNameOrId(name);
      app.delete(c);
    } catch (e) { }
  }
})
