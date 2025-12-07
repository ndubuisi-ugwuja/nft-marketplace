/** @type {import('next').NextConfig} */
const nextConfig = {
    // Empty turbopack config to silence the warning
    turbopack: {},

    webpack: (config, { isServer }) => {
        config.externals.push("pino-pretty", "lokijs", "encoding");

        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }

        return config;
    },

    transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
};

module.exports = nextConfig;
