import type { CheckoutResult, PlanOption } from "./types";

/** Plans only advertise features that exist today; backlog items are marked. */
export const PLANS: PlanOption[] = [
  {
    id: "free",
    name: "Free",
    label: "Free",
    priceUsd: 0,
    cadence: "free",
    features: [
      "Wait Runner + Orbit Catch",
      "Local personal bests and streaks",
      "Dark and light themes",
      "Core session lifecycle",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    label: "Pro",
    priceUsd: 9,
    cadence: "/mo",
    highlighted: true,
    features: [
      "Everything in Free",
      "Brand customization",
      { text: "Analytics events", backlog: true },
      { text: "Additional game packs", backlog: true },
      "Priority support",
    ],
  },
];

let lastCheckoutError: string | null = null;

export function getLastCheckoutError(): string | null {
  return lastCheckoutError;
}

export interface CheckoutFlowOptions {
  /** Stripe Payment Link URLs per paid plan id. When set, selecting that plan
   *  opens a real Stripe checkout and can genuinely generate revenue. When
   *  unset, the same flow renders the honest confirmed-result preview. */
  paymentLinks?: Record<string, string>;
}

/** Build a small checkout surface. Success is only ever shown from the host's
 *  confirmed result — the preview never fabricates a payment, and Stripe
 *  redirects are real charges that land in the host's own dashboard. */
export function createCheckoutFlow(
  onCheckout: (planId: string) => Promise<{ ok: boolean; paymentId?: string } | CheckoutResult>,
  opts: CheckoutFlowOptions = {}
): { open(): void; close(): void; destroy(): void } {
  let overlay: HTMLElement | null = null;
  let disposed = false;

  const live = opts.paymentLinks;
  const livePlans = PLANS.filter((p) => p.priceUsd > 0 && live?.[p.id]).map((p) => p.id);

  const build = (): HTMLElement => {
    const root = document.createElement("div");
    root.className = "qs-checkout";
    root.style.cssText = [
      "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;",
      "background:rgba(15,17,26,0.6);font-family:system-ui,sans-serif;padding:16px;box-sizing:border-box;",
    ].join("");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "qs-checkout-title");

    const card = document.createElement("div");
    card.className = "qs-checkout-card";
    card.style.cssText = [
      "background:linear-gradient(180deg,#202334,#181a27);border:1px solid rgba(255,255,255,0.12);",
      "border-radius:18px;padding:22px;max-width:460px;width:100%;color:#f8f9fc;",
      "box-shadow:0 24px 70px rgba(0,0,0,0.5);",
    ].join("");

    card.innerHTML =
      `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">` +
      `<strong id="qs-checkout-title" style="font-size:17px;">QuickSpin plans</strong>` +
      `<button class="qs-checkout-close" aria-label="Close" style="background:none;border:none;color:#a9b0c0;font-size:20px;cursor:pointer;line-height:1;">×</button></div>` +
      `<p style="margin:0 0 16px;color:#a9b0c0;font-size:12.5px;line-height:1.5;">` +
      (livePlans.length
        ? `<span style="background:rgba(22,163,106,0.15);color:#35d693;border-radius:6px;padding:2px 7px;font-weight:600;font-size:11px;">Stripe · real payment</span>` +
          ` Selecting a live plan opens a real Stripe Payment Link. The result lives in your Stripe dashboard — QuickSpin never claims a payment it can't verify.`
        : `<span style="background:rgba(229,72,77,0.15);color:#ff8f93;border-radius:6px;padding:2px 7px;font-weight:600;font-size:11px;">Checkout preview</span>` +
          ` No real payment is made in this demo. Success is only shown when a payment provider confirms it.`) +
      `</p>`;

    for (const plan of PLANS) {
      const row = document.createElement("div");
      row.className = "qs-plan";
      row.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:12px;" +
        "margin-bottom:10px;cursor:pointer;border:1px solid " +
        (plan.highlighted ? "rgba(102,88,232,0.55)" : "rgba(255,255,255,0.08)") +
        ";background:" +
        (plan.highlighted ? "rgba(102,88,232,0.10)" : "rgba(255,255,255,0.02)") +
        ";";
      row.tabIndex = 0;
      const feats = plan.features
        .map((f) =>
          typeof f === "string"
            ? `<span>· ${f}</span>`
            : `<span style="opacity:.65">· ${f.text} <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#ffb547;">(after the hackathon)</span></span>`
        )
        .join("<br/>");
      row.innerHTML =
        `<div><div style="font-weight:600;font-size:14px;">${plan.name}${plan.highlighted ? ' <span style="color:#8b7cff;font-size:10.5px;font-weight:700;letter-spacing:.4px;">RECOMMENDED</span>' : ""}</div>` +
        `<div style="color:#a9b0c0;font-size:11px;margin-top:4px;line-height:1.6;">${feats}</div></div>` +
        `<div style="text-align:right;white-space:nowrap;"><div style="font-size:18px;font-weight:700;">$${plan.priceUsd}<span style="font-size:11px;color:#888;font-weight:400;"> ${plan.cadence}</span></div></div>`;
      const doSelect = () => void select(plan);
      row.addEventListener("click", doSelect);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doSelect();
        }
      });
      card.appendChild(row);
    }

    const statusEl = document.createElement("div");
    statusEl.style.cssText = "min-height:18px;margin-top:10px;font-size:12px;color:#a9b0c0;";
    card.appendChild(statusEl);

    const close = () => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      lastCheckoutError = null;
    };

    const select = async (plan: PlanOption): Promise<void> => {
      const link = plan.priceUsd > 0 ? live?.[plan.id] : undefined;
      if (link) {
        statusEl.textContent = "Opening Stripe checkout…";
        await new Promise((r) => setTimeout(r, 300));
        if (disposed || !overlay) return;
        window.location.assign(link);
        return;
      }
      statusEl.textContent = "Processing…";
      try {
        const result = await onCheckout(plan.id);
        if (result.ok) {
          statusEl.textContent = `✓ ${plan.name} ${plan.priceUsd > 0 ? "confirmed" : "active"}${result.paymentId ? " · " + result.paymentId : ""}`;
        } else {
          statusEl.textContent = "Checkout declined. No payment was made.";
          lastCheckoutError = "declined";
        }
      } catch (err) {
        statusEl.textContent = "Checkout failed. No payment was made.";
        lastCheckoutError = err instanceof Error ? err.message : String(err);
      }
    };

    card.querySelector(".qs-checkout-close")?.addEventListener("click", close);
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    card.appendChild(statusEl);
    root.appendChild(card);

    const focusables = Array.from(card.querySelectorAll<HTMLElement>(".qs-plan"));
    root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const list = [focusables[focusables.length - 1], focusables[0]];
        if (e.shiftKey ? e.target === focusables[0] : e.target === list[0]) {
          e.preventDefault();
          (e.shiftKey ? focusables[focusables.length - 1] : focusables[0]).focus();
        }
      }
    });

    return root;
  };

  return {
    open() {
      if (disposed || overlay) return;
      lastCheckoutError = null;
      overlay = build();
      document.body.appendChild(overlay);
      const first = overlay.querySelector<HTMLElement>(".qs-plan");
      first?.focus();
    },
    close() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
    },
    destroy() {
      disposed = true;
      this.close();
    },
  };
}

export function readyCheckout(result: { ok: boolean; paymentId?: string }): CheckoutResult {
  return {
    ok: result.ok,
    planId: "pro",
    paymentId: result.paymentId,
    amountUsd: result.ok ? 9 : 0,
  };
}
