db = db.getSiblingDB("education");

db.universities.insertOne({
  _id: 1,
  name: "MIREA",
  institutes: [
    {
      _id: 1,
      name: "IKB",
      departments: [
        {
          _id: 1,
          name: "KB3",
        },
        {
          _id: 2,
          name: "KB4",
        },
      ],
    },
    {
      _id: 2,
      name: "IIT",
      departments: [
        {
          _id: 3,
          name: "IT5",
        },
      ],
    },
  ],
});
