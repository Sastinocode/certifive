type Rating = "A" | "B" | "C" | "D" | "E" | "F" | "G";

interface EnergyRatingProps {
  rating: Rating;
  size?: "sm" | "md";
  className?: string;
}

const colors: Record<Rating, string> = {
  A: "bg-er-a text-white",
  B: "bg-er-b text-white",
  C: "bg-er-c text-white",
  D: "bg-er-d text-[#5a4d00]",
  E: "bg-er-e text-white",
  F: "bg-er-f text-white",
  G: "bg-er-g text-white",
};

export function EnergyRating({ rating, size = "md", className = "" }: EnergyRatingProps) {
  const sizeClass = size === "sm"
    ? "w-6 h-6 rounded-md text-xs"
    : "w-[30px] h-[30px] rounded-lg text-sm";

  return (
    <span className={`inline-flex items-center justify-center font-extrabold ${sizeClass} ${colors[rating]} ${className}`}>
      {rating}
    </span>
  );
}

// Row of rating chips A–G with one highlighted
interface EnergyRatingRowProps {
  highlight?: Rating;
  ratings?: Rating[];
}

export function EnergyRatingRow({ highlight, ratings = ["A","B","C","D","E"] }: EnergyRatingRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      {ratings.map(r => (
        <div key={r} className={`transition-all ${highlight === r ? "scale-125 shadow-sm" : "opacity-70"}`}>
          <EnergyRating rating={r} />
        </div>
      ))}
    </div>
  );
}
