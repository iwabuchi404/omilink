/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3669369452")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number176944289",
    "max": null,
    "min": null,
    "name": "rows",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3669369452")

  // remove field
  collection.fields.removeById("number176944289")

  return app.save(collection)
})
