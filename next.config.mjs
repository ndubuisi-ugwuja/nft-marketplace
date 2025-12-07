/** @type {import('next').NextConfig} */
const nextConfig = {
    // Explicitly disable Turbopack to use webpack
    experimental: {
        turbo: undefined,
    },

    webpack: (config, { isServer }) => {
        // Externalize problematic packages
        config.externals.push("pino-pretty", "lokijs", "encoding");

        // Ignore test files
        config.module = config.module || {};
        config.module.rules = config.module.rules || [];

        config.module.rules.push({
            test: /\.test\.(js|mjs|ts|tsx)$/,
            loader: "ignore-loader",
        });

        // Resolve fallbacks for Node.js modules
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                http: false,
                https: false,
                zlib: false,
                path: false,
                os: false,
            };
        }

        return config;
    },

    transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
};

module.exports = nextConfig;
