const packageJson = require('../package.json');

const appMetadata = Object.freeze({
    name: 'LeadBenefits CRM',
    version: packageJson.version,
    build: process.env.LEADBENEFITS_BUILD || process.env.RAILWAY_GIT_COMMIT_SHA || '',
    environment: process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento',
    publishedAt: ''
});

module.exports = appMetadata;
