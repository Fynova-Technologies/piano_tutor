interface ProgressCricleProps{
    normalizedRadius: number;
    radius: number;
    fillcolor:string;
}
export default function ProgressCircle({ normalizedRadius, radius, fillcolor }: ProgressCricleProps) {
    return(
        <>
            <circle
                fill={fillcolor}
                strokeWidth="12"
                r={normalizedRadius}
                cx={radius*1.5}
                cy={radius*1.5}
                className="group-hover:stroke-[#F8F6F1] transition-transform duration-1000 ease-in-out stroke-[#f2e6c1]"
            />
        </>
    )
}