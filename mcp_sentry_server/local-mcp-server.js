require('dotenv').config();

const axios = require('axios');

const SENTRY_ORG = 'ClariMap';          
const SENTRY_PROJECT = 'clarimap-cool-proyect';      
const SENTRY_TOKEN = process.env.SENTRY_TOKEN;

process.stdin.setEncoding('utf8');

let input = '';

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', async () => {
  try {
    const request = JSON.parse(input);
    const query = request.query || '';

    const response = await axios.get(
      `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/`,
      {
        headers: {
          Authorization: `Bearer ${SENTRY_TOKEN}`
        },
        params: {
          query,
          limit: 10,
          sort: 'date'
        }
      }
    );

    const issues = response.data;

    const result = {
      nodes: issues.map(issue => ({
        id: issue.id,
        label: issue.title,
        detail: issue.metadata.type || '',
        url: issue.permalink
      }))
    };

    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stderr.write(`Error: ${error.message}`);
    process.stdout.write(JSON.stringify({ nodes: [] }));
  }
});
