import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TopBarBackButton } from "./TopBarBackButton";
import { TopBarSettingsButton } from "./TopBarSettingsButton";

interface LegalShellProps {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  version: string;
  children: ReactNode;
  onOpenSettings?: () => void;
  showAgreementNotice?: boolean;
  agreementHref?: string;
}

export function LegalShell({
  title,
  eyebrow,
  lastUpdated,
  version,
  children,
  onOpenSettings,
  showAgreementNotice = true,
  agreementHref,
}: LegalShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <main
      className="screen-enter relative flex w-full flex-col gap-4 px-4 pb-12 pt-5"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
        minHeight: "100%",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl"
      />

      <header className="relative z-10 flex items-center justify-between gap-3">
        <TopBarBackButton onClick={handleBack} />
        <span
          aria-hidden
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "#d8d4eb" }}
        >
          {eyebrow}
        </span>
        {onOpenSettings ? (
          <TopBarSettingsButton onClick={onOpenSettings} />
        ) : (
          <span aria-hidden className="size-10 shrink-0" />
        )}
      </header>

      <section className="relative z-10 mt-2 flex flex-col gap-2 text-left">
        <h1
          className="font-serif"
          style={{
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.15,
            color: "#eef1f6",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "rgba(216,212,235,0.55)",
            letterSpacing: "0.04em",
          }}
        >
          Last updated {lastUpdated} · Version {version}
        </p>
      </section>

      <article
        className="relative z-10 flex flex-col gap-5 text-left"
        style={{ color: "rgba(216,212,235,0.85)" }}
      >
        {children}
      </article>

      {showAgreementNotice && (
        <aside
          className="relative z-10 mt-2 rounded-2xl p-4"
          style={{
            background: "rgba(188,194,255,0.06)",
            border: "0.5px solid rgba(188,194,255,0.12)",
          }}
        >
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.55,
              color: "rgba(216,212,235,0.78)",
              margin: 0,
            }}
          >
            By using Mabuh-ai you confirm that you have read and agree to
            this document{agreementHref ? " and the " : " and the "}
            <Link
              to={agreementHref ?? "/terms"}
              state={{ from: location.pathname }}
              className="font-medium text-foreground underline decoration-[rgba(188,194,255,0.45)] underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {agreementHref === "/terms" ? "Terms & Conditions" : "Privacy Policy"}
            </Link>
            .
          </p>
        </aside>
      )}
    </main>
  );
}
