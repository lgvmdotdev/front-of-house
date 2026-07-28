import { z } from "zod/mini";

const whatsappWorkerEnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	DATABASE_URL: z.string(),
	WHATSAPP_ACCESS_TOKEN: z.string(),
	WHATSAPP_PHONE_NUMBER_ID: z.string(),
	WHATSAPP_API_VERSION: z.optional(z.string()),
});

const createEnv = (env: typeof Bun.env) => {
	if (env.SKIP_ENV_VALIDATION) {
		return env as z.infer<typeof whatsappWorkerEnvSchema>;
	}

	const result = whatsappWorkerEnvSchema.safeParse(env);
	if (result.success) {
		return result.data;
	}

	process.exitCode = 1;
	throw new Error(result.error.message);
};

export const env = createEnv(process.env);
