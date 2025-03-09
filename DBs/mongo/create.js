db = db.getSiblingDB("education");

db.createCollection("universities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "institutes", "name"],
      properties: {
        _id: {
          bsonType: "number",
        },
        name: {
          bsonType: "string",
        },
        institutes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["_id", "departments", "name"],
            properties: {
              _id: {
                bsonType: "number",
              },
              name: {
                bsonType: "string",
              },
              departments: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["_id", "name"],
                  properties: {
                    _id: {
                      bsonType: "number",
                    },
                    name: {
                      bsonType: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
