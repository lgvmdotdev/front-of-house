import { z } from "zod/mini";

const whatsappWebhookEnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	DATABASE_URL: z.string(),
	WHATSAPP_VERIFY_TOKEN: z.string(),
	WHATSAPP_APP_SECRET: z.string(),
	PORT: z.optional(z.string()),
});

const createEnv = (env: typeof Bun.env) => {
	if (env.SKIP_ENV_VALIDATION) {
		return env as z.infer<typeof whatsappWebhookEnvSchema>;
	}

	const result = whatsappWebhookEnvSchema.safeParse(env);
	if (result.success) {
		return result.data;
	}

	process.exitCode = 1;
	throw new Error(result.error.message);
};

export const env = createEnv(process.env);
