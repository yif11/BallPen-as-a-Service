import { useEffect, useState } from "react";

export default function Pen() {
  const [isPressedDown, setIsPressedDown] = useState(false);
  const [penTipOut, setPenTipOut] = useState(false);
  const [pressCount, setPressCount] = useState(0);

  useEffect(() => {
    fetch("/state")
      .then(res => res.json())
      .then(data => {
        setPenTipOut(data.penTipOut);
        setPressCount(data.pressCount);
      });
  }, []);

  const handleDown = () => {
    setIsPressedDown(true);
    fetch("/press", { method: "POST" });
  };

  const handleUp = async () => {
    setIsPressedDown(false);
    setPenTipOut((prev) => !prev);
    const res = await fetch("/release", { method: "POST" });
    const data = await res.json();
    setPenTipOut(data.penTipOut);
    setPressCount(data.pressCount);
  };

  let img = "/pen-in.png";
  if (isPressedDown) img = "/pen-pressed.png";
  else if (penTipOut) img = "/pen-out.png";

  return (
    <div
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      className="w-screen h-screen relative"
    >
      <img src={img} className="w-full h-full object-cover" />
      <div className="absolute top-4 left-4 text-black text-2xl z-10 drop-shadow pointer-events-none">
        Press Count: {pressCount}
      </div>
    </div>
  );
}
