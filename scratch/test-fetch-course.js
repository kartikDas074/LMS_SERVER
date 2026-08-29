async function test() {
  const res = await fetch('http://localhost:1337/api/courses/oj7lt7av43rwdiz3w6pqsv0u?populate[thumbnail]=true&populate[instructor]=true');
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

test().catch(console.error);
