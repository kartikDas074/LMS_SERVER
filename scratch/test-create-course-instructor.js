async function testCreate() {
  // First login as instructor
  const loginRes = await fetch('http://localhost:1337/api/auth/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'pki',
      password: 'Password123!', // or test credentials
    }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.log('Login failed:', loginData);
    return;
  }

  const token = loginData.jwt;
  console.log('Instructor logged in successfully. User ID:', loginData.user?.id);

  // Create course as instructor
  const createRes = await fetch('http://localhost:1337/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        title: 'Instructor Test Course ' + Date.now().toString(36),
        shortDescription: 'Short description for testing',
        description: 'Detailed course description',
        level: 'Intermediate',
        duration: 10,
        topic: 'Test Topic',
        skills: 'Testing',
        price: 99.99,
        thumbnail: [],
      },
    }),
  });

  const createData = await createRes.json();
  console.log('Create Status:', createRes.status);
  console.log('Create Result:', JSON.stringify(createData, null, 2));

  if (createData?.data?.documentId) {
    const docId = createData.data.documentId;
    console.log('Testing GET created course by documentId:', docId);

    const getRes = await fetch(`http://localhost:1337/api/courses/${docId}?populate[thumbnail]=true&populate[instructor]=true`);
    console.log('GET Status:', getRes.status);
    const getData = await getRes.json();
    console.log('GET Result:', JSON.stringify(getData, null, 2));
  }
}

testCreate().catch(console.error);
