document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  try {
    const res = await fetch('http://localhost:3000/api/submit-visa-application', {
      method: 'POST',
      body: data
    });

    const result = await res.json();
    if (result.success) {
      alert(`Booking submitted successfully! Your reference: ${result.booking_reference}`);
      form.reset();
    } else {
      alert('Error submitting booking.');
    }
  } catch (err) {
    console.error(err);
    alert('Error submitting booking.');
  }
});

document.getElementById('lookupBtn').addEventListener('click', async () => {
  const ref = document.getElementById('lookupRef').value.trim();
  if (!ref) return alert('Please enter a booking reference.');

  try {
    const res = await fetch(`http://localhost:3000/api/submission/by-booking/${ref}`);
    const result = await res.json();

    if (!result.success) {
      document.getElementById('result').innerHTML = '<p>Booking not found.</p>';
      return;
    }

    const data = result.submission;

    const html = `
      <h3>Booking Reference: ${data.booking_reference}</h3>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>ID Number:</strong> ${data.fields.id_number}</p>
      <p><strong>Name:</strong> ${data.fields.full_names} ${data.fields.surname}</p>
      <p><strong>Email:</strong> ${data.fields.email}</p>
      <p><strong>Phone:</strong> ${data.fields.phone}</p>
      <h4>Uploaded Files:</h4>
      <ul>
        ${data.files.map(f => `<li><a href="http://localhost:3000/${f.path}" target="_blank">${f.original}</a></li>`).join('')}
      </ul>
    `;

    document.getElementById('result').innerHTML = html;

  } catch (err) {
    console.error(err);
    alert('Error looking up booking.');
  }
});
