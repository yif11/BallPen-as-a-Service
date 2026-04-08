import { useCallback, useEffect, useRef, useState } from "react";

type PenState = {
	penTipOut: boolean;
	pressCount: number;
};

// iOS requires AudioContext to be created/resumed during user interaction
function createAudioPlayer() {
	let audioContext: AudioContext | null = null;
	const buffers: Map<string, AudioBuffer> = new Map();

	const ensureContext = () => {
		if (!audioContext) {
			audioContext = new AudioContext();
		}
		if (audioContext.state === "suspended") {
			audioContext.resume();
		}
		return audioContext;
	};

	const loadSound = async (url: string) => {
		if (buffers.has(url)) return;
		try {
			const ctx = ensureContext();
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
			buffers.set(url, audioBuffer);
		} catch {
			// Ignore loading errors
		}
	};

	const play = (url: string) => {
		try {
			const ctx = ensureContext();
			const buffer = buffers.get(url);
			if (buffer) {
				const source = ctx.createBufferSource();
				source.buffer = buffer;
				source.connect(ctx.destination);
				source.start(0);
			}
		} catch {
			// Ignore playback errors
		}
	};

	return { loadSound, play, ensureContext };
}

const audioPlayer = createAudioPlayer();

export default function Pen() {
	const [isPressedDown, setIsPressedDown] = useState(false);
	const [penTipOut, setPenTipOut] = useState(false);
	const [pressCount, setPressCount] = useState(0);
	const processingRef = useRef<Promise<void>>(Promise.resolve());
	const soundsLoadedRef = useRef(false);

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

	const loadSoundsOnFirstInteraction = useCallback(() => {
		if (soundsLoadedRef.current) return;
		soundsLoadedRef.current = true;
		audioPlayer.ensureContext();
		audioPlayer.loadSound("/press.mp3");
		audioPlayer.loadSound("/release.mp3");
	}, []);

	const handleDown = () => {
		loadSoundsOnFirstInteraction();
		setIsPressedDown(true);
		audioPlayer.play("/press.mp3");
		fetch("/press", { method: "POST" });
	};

	const handleUp = () => {
		setIsPressedDown(false);
		audioPlayer.play("/release.mp3");
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
