// STEP 1: Takes a "rating" number as a prop (e.g. 4.5) and renders stars
function StarRating({ rating }) {
  // STEP 2: Build an array of 5 items so we can .map() over it to draw 5 stars
  const stars = [1, 2, 3, 4, 5];

  return (
    <span className="inline-flex gap-0.5">
      {stars.map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-amber-400" : "text-gray-600"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default StarRating;