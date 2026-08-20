const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: "Turnstile is not configured." };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (!result.success) {
      return {
        success: false,
        error: result["error-codes"]?.[0] ?? "Captcha verification failed.",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Captcha verification failed." };
  }
}
