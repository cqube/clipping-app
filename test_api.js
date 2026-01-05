const axios = require('axios');

(async () => {
    try {
        console.log('Testing /api/articles...');
        const res = await axios.get('http://localhost:3000/api/articles');
        console.log('Status:', res.status);
        console.log('Data Type:', Array.isArray(res.data) ? 'Array' : typeof res.data);
        console.log('Count:', Array.isArray(res.data) ? res.data.length : 'N/A');

        if (Array.isArray(res.data) && res.data.length > 0) {
            console.log('Sample Article:', res.data[0].title);
        } else {
            console.log('Response body:', JSON.stringify(res.data, null, 2));
        }
    } catch (err) {
        console.error('API Request Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
})();
