import React from "react";
import iconUrl from "./icon.svg";
import { ReactComponent as Icon } from "./icon.svg?react";

export function App() {
	return (
		<div>
			<Icon />
			<img src={iconUrl} alt="icon" />
		</div>
	);
}
