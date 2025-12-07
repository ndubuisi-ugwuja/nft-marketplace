/** @type {import('next').NextConfig} */
const nextConfig = {
    // Empty turbopack config to acknowledge it exists
    turbopack: {},

    // Tell Next.js to use webpack
    experimental: {
        forceSwcTransforms: true,
    },

    serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

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
