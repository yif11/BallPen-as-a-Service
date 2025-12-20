/// <reference lib="dom" />

import ReactDOM from "react-dom/client";
import Pen from "./Pen";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
	ReactDOM.createRoot(root).render(<Pen />);
}
