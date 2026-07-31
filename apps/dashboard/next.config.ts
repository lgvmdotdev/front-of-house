import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	poweredByHeader: false,
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["@workspace/ui"],
	serverExternalPackages: [
		"@workspace/env",
		"@workspace/auth",
		"@workspace/db",
	],
	experimental: {
		// Enables `forbidden()` so `/admin` renders a real 403 for non-admins
		// instead of silently redirecting them somewhere else.
		authInterrupts: true,
	},
};

export default nextConfig;
