const ENV_CONFIG: any = {
    development: {
        apiUrl: import.meta.env.VITE_DEVELOPMENT_APIURL,
        siteUrl: import.meta.env.VITE_DEVELOPMENT_SITEURL,
    },
    staging: {
        apiUrl: import.meta.env.VITE_STAGING_APIURL,
        siteUrl: import.meta.env.VITE_STAGING_SITEURL,
    },
    production: {
        apiUrl: import.meta.env.VITE_LIVE_APIURL,
        siteUrl: import.meta.env.VITE_LIVE_SITEURL,
    },
};

console.log("Envirment",import.meta.env.VITE_DEVELOPMENT)

const currentEnv = import.meta.env.VITE_DEVELOPMENT || "development";
const SECRET_PASSPHRASE_QUICKBOOKS = "FIREPAYPOS"

const { apiUrl, siteUrl } = ENV_CONFIG[currentEnv] || ENV_CONFIG["development"];

export { apiUrl, siteUrl, SECRET_PASSPHRASE_QUICKBOOKS };

export const ProjectName = import.meta.env.VITE_PROJECT_NAME || 'POS Bucket';
