const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMyIsInNlc3Npb25JZCI6ImZmZDYzZDE5YmNhN2Q4ZjRlYzQxYTIyZjk3NjI5OTE4IiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc4Nzg2ODA1MCwiZXhwIjoxNzg3ODY4NjUwfQ.E3WoCqE6DsvkFPaLRSVDiepBDnZr9A57MrguZGKZ6lE';

async function run() {
  console.log('=== 1. CREATE BLOG ===');
  const createRes = await fetch('http://localhost:1337/api/blogs', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        title: 'Lifecycle Test Blog',
        Description: [{ type: 'paragraph', children: [{ type: 'text', text: 'Initial description' }] }],
        slug: 'lifecycle-test-blog',
        creator: 13
      }
    })
  });
  const created = await createRes.json();
  console.log('Create Status:', createRes.status);
  console.log('Created blog:', JSON.stringify(created, null, 2));

  const docId = created.data?.documentId;
  if (!docId) return;

  console.log('\n=== 2. EDIT DESCRIPTION ONLY ===');
  const updateRes1 = await fetch(`http://localhost:1337/api/blogs/${docId}`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        title: 'Lifecycle Test Blog',
        Description: [{ type: 'paragraph', children: [{ type: 'text', text: 'Updated description' }] }],
        slug: 'lifecycle-test-blog',
        creator: 13
      }
    })
  });
  const updated1 = await updateRes1.json();
  console.log('Update 1 Status:', updateRes1.status);
  console.log('Update 1 Result:', JSON.stringify(updated1, null, 2));

  console.log('\n=== 3. TEST PUBLISH / UNPUBLISH ===');
  // Test PUT with publishedAt
  const pubRes = await fetch(`http://localhost:1337/api/blogs/${docId}`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        publishedAt: new Date().toISOString()
      }
    })
  });
  const pubData = await pubRes.json();
  console.log('Publish via PUT publishedAt Status:', pubRes.status);
  console.log('Publish result:', JSON.stringify(pubData, null, 2));

  // Test Unpublish via PUT publishedAt null
  const unpubRes = await fetch(`http://localhost:1337/api/blogs/${docId}`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        publishedAt: null
      }
    })
  });
  const unpubData = await unpubRes.json();
  console.log('Unpublish via PUT publishedAt null Status:', unpubRes.status);
  console.log('Unpublish result:', JSON.stringify(unpubData, null, 2));

  // Test POST /publish endpoint if any exists
  const customPub = await fetch(`http://localhost:1337/api/blogs/${docId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
  });
  console.log('POST /blogs/{id}/publish Status:', customPub.status);
}

run();
