import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

export default function SASRReport() {
    const data = [
  { date: "05/22/2025", score: 90 },
  { date: "05/23/2025", score: 60 },
  { date: "05/24/2025", score: 10 },
  { date: "05/25/2025", score: 25 },
  { date: "05/26/2025", score: 70 },
  { date: "05/27/2025", score: 55 },
  { date: "05/28/2025", score: 45 },
  { date: "05/29/2025", score: 20 },
];
    return (
        <>
            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={data}>
                                <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="2%" stopColor="#581845" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#581845" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date"  scale="band"  type="category"   tick={{ fontSize: 10 }}/>
                                <YAxis domain={[0, 100]} />
                                <CartesianGrid strokeDasharray="6 6" opacity={1} />
                                <Tooltip />
                                <Area dataKey="score"  type="monotone"  stroke="#581845"  fill="url(#colorScore)" strokeWidth={1.5}  dot={{ r: 5, fill: "#fff", stroke: "#581845", fillOpacity:"1", strokeWidth: 2 }}/>                  
                                </AreaChart>
                            </ResponsiveContainer>
        </>
    );
    }