create (l:Lesson {id: 10, name: "Math", course_id: 1 }),
(g:Group {id: 35, name: "BSBO-01-22"}),
(s1:Student {id: 1}),
(s2:Student {id: 2}),
(l)-[:SCHEDULE {start_time: 1740693962}]->(g),
(g)-[:GROUP_FOR_STUDENT]->(s1),
(g)-[:GROUP_FOR_STUDENT]->(s2)
