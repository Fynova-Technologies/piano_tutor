export default function test(){
    const array1 = [
    { name: "Card 1A", description: "First column card" },
    { name: "Card 2A", description: "Another card in column 1" },
    { name: "Card 3A", description: "Column 1 again" },
  ];

  const array2 = [
    { name: "Card 1B", description: "First column 2 card" },
    { name: "Card 2B", description: "Another card in column 2" },
    { name: "Card 3B", description: "Column 2 again" },
  ];
    return(
        <div className="grid grid-cols-2 gap-4">
  {/* Column 1 */}
  <div className="flex flex-col gap-4">
    {array1.map((item, idx) => (
      <div key={idx} className="bg-white shadow p-4 rounded">
        {item.name}
      </div>
    ))}
  </div>

  {/* Column 2 */}
  <div className="flex flex-col gap-4">
    {array2.map((item, idx) => (
      <div key={idx} className="bg-white shadow p-4 rounded">
        {item.name}
      </div>
    ))}
  </div>
</div>

    )
}