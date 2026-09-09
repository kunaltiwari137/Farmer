function LoadingTruck({ fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-80 h-40" style={{ perspective: "600px" }}>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-24 bg-green-400 rounded-full blur-3xl opacity-30 animate-glow-pulse"></div>

        <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
        <div
          className="absolute bottom-8 left-0 right-0 h-1 opacity-60 animate-road-scroll"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, #6ee7b7 0 20px, transparent 20px 40px)",
          }}
        ></div>

        <div className="absolute bottom-8 animate-truck-drive" style={{ transformStyle: "preserve-3d" }}>
          <div className="relative w-24 h-12">

            <div className="absolute bottom-0 left-0 w-16 h-9 rounded-sm shadow-lg"
                 style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}>
              <div className="absolute inset-x-1 top-1 bottom-2 bg-black/10 rounded-sm"></div>
            </div>

            <div className="absolute bottom-0 right-0 w-8 h-12 rounded-sm shadow-lg"
                 style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}>
              <div className="absolute inset-1 top-1 h-4 bg-cyan-200/50 rounded-sm"></div>
            </div>

            <div className="absolute -bottom-2 left-2 w-5 h-5 rounded-full border-2 border-gray-300 animate-wheel-spin"
                 style={{ background: "radial-gradient(circle at 35% 35%, #555, #111)" }}></div>
            <div className="absolute -bottom-2 right-3 w-5 h-5 rounded-full border-2 border-gray-300 animate-wheel-spin"
                 style={{ background: "radial-gradient(circle at 35% 35%, #555, #111)" }}></div>

            <div className="absolute top-0 left-4 w-3 h-3 rounded-sm bg-amber-500 shadow-md animate-crate-arc"></div>

            <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-amber-200/60 blur-sm animate-dust-puff"></div>
            <div className="absolute -bottom-1 -left-5 w-2 h-2 rounded-full bg-amber-200/40 blur-sm animate-dust-puff" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      </div>

      <p className="font-display text-lg tracking-widest text-shimmer mt-4">
        LOADING FRESH CROPS
      </p>
    </div>
  );

  // STEP 1: If used as a full-page splash, wrap it in a fixed, full-screen dark backdrop
  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "var(--soil)" }}
      >
        {content}
      </div>
    );
  }

  // STEP 2: Otherwise, render inline exactly as before (used inside CropList)
  return content;
}

export default LoadingTruck;