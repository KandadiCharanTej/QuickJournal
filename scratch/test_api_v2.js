const fetch = require('node-fetch');

async function testApi() {
  const res = await fetch('http://localhost:5000/api/generate-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'Environmental Science',
      moduleRoman: 'IV',
      topic: 'Explain the stages of Wastewater Treatment.',
      sectionTag: 'ASSIGNMENT'
    })
  });
  const data = await res.json();
  console.log(data.text);
}

testApi();
