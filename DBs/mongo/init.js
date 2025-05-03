db = db.getSiblingDB("education");

db.createCollection("universities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "institutes", "name"],
      properties: {
        id: {
          bsonType: "number",
        },
        name: {
          bsonType: "string",
        },
        institutes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "departments", "name"],
            properties: {
              id: {
                bsonType: "number",
              },
              name: {
                bsonType: "string",
              },
              departments: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["id", "name"],
                  properties: {
                    id: {
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
