/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},

    experimental: {
        forceSwcTransforms: true,
    },

    serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push("pino", "pino-pretty", "thread-stream");
        }

        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }

        // Fix for WalletConnect/Wagmi SSR issues
        config.externals.push({
            "utf-8-validate": "commonjs utf-8-validate",
            bufferutil: "commonjs bufferutil",
        });

        return config;
    },

    transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
};

module.exports = nextConfig;
