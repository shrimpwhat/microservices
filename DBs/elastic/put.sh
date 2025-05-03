curl -X POST "http://localhost:9200/lessons_materials/_doc/3" -H "Content-Type: application/json" -d'
{
  "text": "lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.",
  "lession_id": "2",
  "annotation": "Short review of the lesson"
}'
