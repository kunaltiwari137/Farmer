import { useRef } from "react";

// STEP 1: This component wraps any content and gives it a mouse-following 3D tilt
function TiltCard({ children, className = "" }) {
  // STEP 2: A ref lets us directly read the DOM element's size/position
  const cardRef = useRef(null);

  // STEP 3: Runs on every mouse movement over the card
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect(); // the card's position/size on screen

    // STEP 4: Cursor position relative to the card's center (0,0 = dead center)
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // STEP 5: Convert that offset into a rotation angle (smaller divisor = more dramatic tilt)
    const rotateY = (x / rect.width) * 16;
    const rotateX = -(y / rect.height) * 16;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  // STEP 6: Reset smoothly back to flat when the mouse leaves
  const handleMouseLeave = () => {
    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-150 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

export default TiltCard;