import { useEffect, useState } from "react";

export default function Pen() {
  const [isPressedDown, setIsPressedDown] = useState(false);
  const [penTipOut, setPenTipOut] = useState(false);
  const [pressCount, setPressCount] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8787/state")
      .then(res => res.json())
      .then(data => {
        setPenTipOut(data.penTipOut);
        setPressCount(data.pressCount);
      });
  }, []);

  const handleDown = () => {
    setIsPressedDown(true);
    fetch("http://localhost:8787/press", { method: "POST" });
  };

  const handleUp = async () => {
    setIsPressedDown(false);
    const res = await fetch("http://localhost:8787/release", { method: "POST" });
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
      className="w-screen h-screen"
    >
      <img src={img} className="w-full h-full object-cover" />
      <div className="absolute top-4 left-4 text-white text-2xl">
        Press Count: {pressCount}
      </div>
    </div>
  );
}
