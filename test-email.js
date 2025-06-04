const fetch = require('node-fetch');

const SERVER_URL = 'http://localhost:5000'; // Change if your server is running elsewhere
const recipient = process.argv[2];

if (!recipient) {
  console.error('Usage: node test-email.js recipient@example.com');
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: recipient }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log('Test email sent successfully!');
    } else {
      console.error('Failed to send test email:', data.error);
    }
  } catch (err) {
    console.error('Error sending test email:', err);
  }
})(); 