import { useEffect, useState, useRef } from "react";

export default function Pen() {
	const [isPressedDown, setIsPressedDown] = useState(false);
	const [penTipOut, setPenTipOut] = useState(false);
	const [pressCount, setPressCount] = useState(0);
	const processingRef = useRef<Promise<void>>(Promise.resolve());

	useEffect(() => {
		fetch("/state")
			.then((res) => res.json())
			.then((data) => {
				setPenTipOut(data.penTipOut);
				setPressCount(data.pressCount);
			});
	}, []);

	const handleDown = () => {
		setIsPressedDown(true);
		fetch("/press", { method: "POST" });
	};

	const handleUp = () => {
		setIsPressedDown(false);
		setPenTipOut((prev) => !prev);
		processingRef.current = processingRef.current.then(async () => {
			const res = await fetch("/release", { method: "POST" });
			const data = await res.json();
			setPenTipOut(data.penTipOut);
			setPressCount(data.pressCount);
		});
	};

	let img = "/pen-in.png";
	if (isPressedDown) img = "/pen-pressed.png";
	else if (penTipOut) img = "/pen-out.png";

	return (
		<div
			onPointerDown={handleDown}
			onPointerUp={handleUp}
			onContextMenu={(e) => e.preventDefault()}
			className="w-screen h-screen relative touch-none select-none"
		>
			<img
				src={img}
				className="w-full h-full object-contain pointer-events-none"
				draggable={false}
			/>
			<div className="absolute top-4 left-4 text-black text-2xl z-10 drop-shadow pointer-events-none">
				Press Count: {pressCount}
			</div>
		</div>
	);
}
