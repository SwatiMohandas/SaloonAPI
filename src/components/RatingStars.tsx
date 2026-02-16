import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
    rating: number; // 0 to 5
    size?: number;
    showValue?: boolean;
}

export default function RatingStars({ rating, size = 16, showValue = false }: RatingStarsProps) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<Star key={i} size={size} className="fill-yellow-400 text-yellow-400" />);
        } else if (i === fullStars && hasHalfStar) {
            stars.push(<StarHalf key={i} size={size} className="fill-yellow-400 text-yellow-400" />);
        } else {
            stars.push(<Star key={i} size={size} className="text-muted-foreground/30" />);
        }
    }

    return (
        <div className="flex items-center gap-1">
            <div className="flex">{stars}</div>
            {showValue && <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>}
        </div>
    );
}
