import { useEffect, useRef, useState } from "react";

type PenState = {
	penTipOut: boolean;
	pressCount: number;
};

export default function Pen() {
	const [isPressedDown, setIsPressedDown] = useState(false);
	const [penTipOut, setPenTipOut] = useState(false);
	const [pressCount, setPressCount] = useState(0);
	const processingRef = useRef<Promise<void>>(Promise.resolve());

	const [pressAudio] = useState(() => {
		const audio = new Audio("/press.mp3");
		audio.preload = "auto";
		return audio;
	});
	const [releaseAudio] = useState(() => {
		const audio = new Audio("/release.mp3");
		audio.preload = "auto";
		return audio;
	});

	useEffect(() => {
		// Preload images
		["/pen-in.jpg", "/pen-pressed.jpg", "/pen-out.jpg"].forEach((src) => {
			const img = new Image();
			img.src = src;
		});

		fetch("/state")
			.then((res) => res.json())
			.then((data) => {
				const state = data as PenState;
				setPenTipOut(state.penTipOut);
				setPressCount(state.pressCount);
			});
	}, []);

	const handleDown = () => {
		setIsPressedDown(true);
		pressAudio.currentTime = 0;
		pressAudio.play().catch(() => {});
		fetch("/press", { method: "POST" });
	};

	const handleUp = () => {
		setIsPressedDown(false);
		releaseAudio.currentTime = 0;
		releaseAudio.play().catch(() => {});
		setPenTipOut((prev) => !prev);
		setPressCount((prev) => prev + 1);
		processingRef.current = processingRef.current.then(async () => {
			const res = await fetch("/release", { method: "POST" });
			const data = (await res.json()) as PenState;
			setPenTipOut(data.penTipOut);
			setPressCount(data.pressCount);
		});
	};

	let img = "/pen-in.jpg";
	if (isPressedDown) img = "/pen-pressed.jpg";
	else if (penTipOut) img = "/pen-out.jpg";

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
