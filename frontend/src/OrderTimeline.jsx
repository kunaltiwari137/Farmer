function OrderTimeline({ status }) {
  // STEP 1: Define the full sequence of steps in order
  const steps = ["pending", "confirmed", "shipped", "delivered"];

  // STEP 2: Find where the current status sits in that sequence
  const currentIndex = steps.indexOf(status);

  // STEP 3: Cancelled is a special case — doesn't fit the linear progress bar
  if (status === "cancelled") {
    return (
      <p className="text-sm font-semibold" style={{ color: "var(--clay)" }}>
        ✕ Order Cancelled
      </p>
    );
  }

  return (
    <div className="flex items-center mt-3">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          {/* STEP 4: The dot for this step — filled if we've reached or passed it */}
          <div className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: index <= currentIndex ? "var(--gold)" : "var(--line)",
                boxShadow: index === currentIndex ? "0 0 8px var(--gold)" : "none",
              }}
            ></div>
            <span
              className="text-[10px] uppercase mt-1 tracking-wide whitespace-nowrap"
              style={{ color: index <= currentIndex ? "var(--mist)" : "var(--mist-dim)" }}
            >
              {step}
            </span>
          </div>

          {/* STEP 5: The connecting line between dots (skip after the last one) */}
          {index < steps.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-1"
              style={{ background: index < currentIndex ? "var(--gold)" : "var(--line)" }}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}

export default OrderTimeline;