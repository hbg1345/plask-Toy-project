import { AtcoderLogo } from "./atcoder-logo";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <a href="https://atcoder.jp/home" target="_blank" rel="noreferrer">
          <AtcoderLogo />
        </a>
      </div>
      <h1 className="sr-only">Supabase and Next.js Starter Template</h1>
      <p className="text-2xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        가장 효율적으로 문제 해결 능력을 <br /> 향상 시키세요.{" "}
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
