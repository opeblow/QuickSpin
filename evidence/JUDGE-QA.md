# Judge Q&A

## “Isn’t this just a game replacing a spinner?”
No. The game lifecycle is bound to the host request. Observable phases change intensity;
evidence-bearing execution events become game objects; real completion ends play; failure remains
failure; the Wait Receipt measures the experience.

## “Are those progress percentages real?”
QuickSpin does not require percentages. `setProgress()` can remain indeterminate. The classic
control’s percentage is explicitly demo-only.

## “How do you know a tool/retrieval event really happened?”
QuickSpin requires a host-owned `evidenceRef`. Missing evidence is rejected as `UNKNOWN /
INSUFFICIENT_EVIDENCE` and does not affect gameplay. The SDK cannot prove the host is honest, so
the trust boundary is explicit rather than hidden.

## “What happens if the AI request fails?”
Run the negative-path proof. A real Promise rejects, the session becomes `failed`, structured
failure evidence is persisted/emitted, and no AI response is fabricated.

## “Does QuickSpin make the model faster?”
No. It targets perceived/experienced waiting and observability, not provider latency.

## “Can you prove users think it is faster?”
Not universally. The Wait Receipt records signed perceived wait and can say the wait felt longer.
More user samples are required for a population claim.

## “Why 650 ms?”
It is an anti-flash product threshold, not a claim about human perception research. Fast replies
can finish before showing the game UI; hosts can configure it.

## “What is still incomplete?”
Public deployment proof, final demo capture, submission package, dependency-vulnerability
reconciliation, and broader user validation remain explicit limitations until completed.
