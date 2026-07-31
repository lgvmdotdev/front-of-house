import { z } from "zod/mini";

const dashboardEnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	DATABASE_URL: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string(),
	PROJECT_NAME: z.string(),
});

const createEnv = (env: typeof Bun.env) => {
	if (env.SKIP_ENV_VALIDATION) {
		return env as z.infer<typeof dashboardEnvSchema>;
	}

	const result = dashboardEnvSchema.safeParse(env);
	if (result.success) {
		return result.data;
	}

	process.exitCode = 1;
	throw new Error(result.error.message);
};

export const env = createEnv(process.env);
