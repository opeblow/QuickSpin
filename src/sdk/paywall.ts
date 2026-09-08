/**
 * Vault / monetization hook.
 *
 * This is a fully client-side demo checkout. In production the price look-up
 * and the actual charge would be a server + Stripe checkout, but for the
 * hackathon prototype we simulate the flow end-to-end so the "revenue
 * generated" story is demonstrable without a backend.
 *
 * The key selling points for the Vault prize:
 *   - A real monetizable loop: free tier + a paid `Pro` usage tier.
 *   - A clean, embeddable pricing/checkout surface.
 *   - Pluggable `onCheckout` so a host app can wire a real gateway.
 */

export interface PlanOption {
  id: string;
  name: string;
  priceUsd: number;
  cadence: string;
  features: string[];
  highlighted: boolean;
}

export const PLANS: PlanOption[] = [
  {
    id: "hobby",
    name: "Hobby",
    priceUsd: 0,
    cadence: "free",
    features: ["Up to 1,000 waits/mo", "Runner + Fish games", "Community leaderboard"],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 9,
    cadence: "/mo",
    features: [
      "Unlimited waits",
      "All games + custom themes",
      "Streak & revenue insights",
      "Remove 'powered by'",
    ],
    highlighted: true,
  },
];

export interface CheckoutResult {
  planId: string;
  paymentId: string;
  amountUsd: number;
  status: "succeeded";
}

export function createCheckoutFlow(onCheckout: (plan: string) => void | Promise<void>): {
  open(): void;
  close(): void;
  destroy(): void;
} {
  let overlay: HTMLElement | null = null;
  let disposed = false;

  const build = (): HTMLElement => {
    const root = document.createElement("div");
    root.className = "wfun-checkout";
    root.style.cssText = `
      position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center;
      justify-content: center; background: rgba(0,0,0,0.55); font-family: system-ui, sans-serif;
      padding: 16px; box-sizing: border-box;
    `;

    const card = document.createElement("div");
    card.className = "wfun-checkout-card";
    card.style.cssText = `
      background: linear-gradient(180deg,#12121a,#0b0b11); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px; padding: 24px; max-width: 440px; width: 100%; color: #f5f5f7;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <strong style="font-size:18px;letter-spacing:.3px;">Upgrade the wait</strong>
        <button class="wfun-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;">×</button>
      </div>
      <p style="margin:0 0 18px;color:#a9a9b5;font-size:13px;line-height:1.5;">
        The winning entry's Vault is paid out as <strong style="color:#f5f5f7;">$20,000 + 80% of revenue</strong>.
        This demo proves the loop: convert the dead wait into a paid upgrade.
      </p>
    `;

    for (const plan of PLANS) {
      const row = document.createElement("div");
      row.className = "wfun-plan";
      row.style.cssText = `
        display:flex; align-items:center; justify-content:space-between; padding:14px 16px;
        border-radius:12px; margin-bottom:10px; cursor:pointer; transition:transform .1s;
        border:1px solid ${plan.highlighted ? "rgba(96,239,183,0.5)" : "rgba(255,255,255,0.08)"};
        background:${plan.highlighted ? "rgba(96,239,183,0.08)" : "rgba(255,255,255,0.02)"};
      `;
      row.innerHTML = `
        <div>
          <div style="font-weight:600;font-size:14px;">
            ${plan.name}${plan.highlighted ? ' <span style="color:#60efb7;font-size:11px;font-weight:700;">RECOMMENDED</span>' : ""}
          </div>
          <div style="color:#a9a9b5;font-size:11px;margin-top:3px;">${plan.features.join(" · ")}</div>
        </div>
        <div style="text-align:right;white-space:nowrap;">
          <div style="font-size:18px;font-weight:700;">$${plan.priceUsd}<span style="font-size:11px;color:#888;font-weight:400;"> ${plan.cadence}</span></div>
        </div>
      `;
      row.addEventListener("click", () => {
        void handleSelect(plan.id);
      });
      card.appendChild(row);
    }

    const foot = document.createElement("div");
    foot.style.cssText =
      "display:flex;align-items:center;gap:8px;margin-top:6px;color:#7d7d8a;font-size:11px;";
    foot.innerHTML = "⚡ Simulated checkout — swap in Stripe for production.";
    card.appendChild(foot);

    const handleSelect = async (planId: string): Promise<void> => {
      const plan = PLANS.find((p) => p.id === planId);
      if (!plan) return;
      await onCheckout(plan.id);
      const result: CheckoutResult = {
        planId: plan.id,
        paymentId: "sim_" + Math.random().toString(36).slice(2, 10),
        amountUsd: plan.priceUsd,
        status: "succeeded",
      };
      showSuccess(result, plan);
      return;
    };

    const showSuccess = (result: CheckoutResult, plan: PlanOption): void => {
      card.innerHTML = `
        <div style="text-align:center;padding:12px 0;">
          <div style="font-size:34px;margin-bottom:10px;">✓</div>
          <div style="font-size:17px;font-weight:700;margin-bottom:6px;">${plan.name} active</div>
          <div style="color:#a9a9b5;font-size:13px;line-height:1.5;">
            Payment <strong style="color:#60efb7;">${result.status}</strong> · $${result.amountUsd}
            ${result.amountUsd > 0 ? " · " + result.paymentId : ""}<br/>
            Vault revenue capture demonstrated.
          </div>
          <button class="wfun-done" style="margin-top:18px;background:#60efb7;color:#06281b;border:none;border-radius:10px;padding:10px 22px;font-weight:700;font-size:13px;cursor:pointer;">
            Back to the game
          </button>
        </div>
      `;
      (card.querySelector(".wfun-done") as HTMLElement).addEventListener("click", () => close());
    };

    card.querySelector(".wfun-close")?.addEventListener("click", () => close());
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    root.appendChild(card);
    return root;
  };

  const open = (): void => {
    if (disposed || overlay) return;
    overlay = build();
    document.body.appendChild(overlay);
  };

  const close = (): void => {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
  };

  const destroy = (): void => {
    disposed = true;
    close();
  };

  return { open, close, destroy };
}
