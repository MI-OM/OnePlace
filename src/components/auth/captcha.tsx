"use client";

import { Turnstile } from "@marsidev/react-turnstile";

type CaptchaProps = {
  onVerify: (token: string) => void;
};

export function Captcha({ onVerify }: CaptchaProps) {
  return (
    <div className="flex justify-center">
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => onVerify(token)}
        options={{ theme: "auto", size: "normal" }}
      />
    </div>
  );
}
