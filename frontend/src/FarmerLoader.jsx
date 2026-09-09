function FarmerLoader() {
  // STEP 1: An array just to generate 5 stalks with staggered animation timing
  const stalks = [0, 1, 2, 3, 4];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "var(--soil)" }}
    >
      <div className="relative flex items-end" style={{ animation: "farmer-step 1.8s ease-in-out infinite" }}>

        {/* Farmer figure */}
        <div className="relative w-10 h-24 mr-2">
          {/* Head */}
          <div
            className="w-4 h-4 rounded-full mx-auto"
            style={{ background: "var(--paper-2)" }}
          ></div>
          {/* Body */}
          <div
            className="w-6 h-10 mx-auto mt-0.5 rounded-sm"
            style={{ background: "var(--crop-deep)" }}
          ></div>
          {/* Arm holding sickle, pivoting from the shoulder */}
          <div
            className="absolute top-5 left-1/2 w-1.5 h-8 rounded-full origin-top"
            style={{
              background: "var(--paper-2)",
              animation: "arm-swing 1.8s ease-in-out infinite",
            }}
          >
            {/* Sickle blade */}
            <div
              className="absolute -bottom-1 -right-2 w-3 h-3 rounded-full"
              style={{
                border: "2px solid var(--gold)",
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
              }}
            ></div>
          </div>
          {/* Legs */}
          <div className="w-6 h-8 mx-auto mt-0.5 flex gap-1">
            <div className="w-2.5 h-8 rounded-sm" style={{ background: "var(--ink)" }}></div>
            <div className="w-2.5 h-8 rounded-sm" style={{ background: "var(--ink)" }}></div>
          </div>
        </div>

        {/* Row of crop stalks being harvested */}
        <div className="flex items-end gap-2">
          {stalks.map((i) => (
            <div
              key={i}
              className="w-2 h-16 rounded-t-full"
              style={{
                background: "linear-gradient(180deg, var(--gold), var(--crop-solid))",
                animation: `stalk-cut 1.8s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Ground line */}
      <div className="w-72 h-px mt-2" style={{ background: "var(--line)" }}></div>

      <p className="font-mono-label mt-6" style={{ color: "var(--gold)" }}>
        Harvesting your data...
      </p>
    </div>
  );
}

export default FarmerLoader;