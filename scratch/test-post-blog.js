const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMyIsInNlc3Npb25JZCI6ImZmZDYzZDE5YmNhN2Q4ZjRlYzQxYTIyZjk3NjI5OTE4IiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc4Nzg2ODA1MCwiZXhwIjoxNzg3ODY4NjUwfQ.E3WoCqE6DsvkFPaLRSVDiepBDnZr9A57MrguZGKZ6lE';

async function testPayload(name, creatorValue) {
  const body = {
    data: {
      title: 'Test Blog ' + name + ' ' + Date.now(),
      Description: [{ type: 'paragraph', children: [{ type: 'text', text: 'Test description content' }] }],
      slug: 'test-blog-' + Date.now(),
      creator: creatorValue
    }
  };
  console.log('\n--- Testing:', name);
  const res = await fetch('http://localhost:1337/api/blogs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Result:', JSON.stringify(data, null, 2));
}

async function run() {
  await testPayload('number 13', 13);
  await testPayload('string 13', '13');
  await testPayload('documentId string', 'qyy0i8b067r8u96axw3zpz5m');
  await testPayload('connect array id', { connect: [13] });
  await testPayload('connect array documentId', { connect: ['qyy0i8b067r8u96axw3zpz5m'] });
}
run();
