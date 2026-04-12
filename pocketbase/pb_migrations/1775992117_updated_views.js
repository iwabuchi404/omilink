/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3669369452")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number1169138922",
    "max": null,
    "min": null,
    "name": "sort_order",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3669369452")

  // remove field
  collection.fields.removeById("number1169138922")

  return app.save(collection)
})
