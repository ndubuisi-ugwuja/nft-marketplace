/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force webpack by setting turbopack to false
    turbo: false,

    serverExternalPackages: ["pino", "pino-pretty"],

    webpack: (config, { isServer }) => {
        // Externalize problematic server-side packages
        if (isServer) {
            config.externals.push("pino", "pino-pretty", "thread-stream");
        }

        // Resolve fallbacks for client-side
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }

        return config;
    },

    transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
};

module.exports = nextConfig;
