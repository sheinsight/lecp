import React from "react";
import styles from "./index.css";

const Demo = () => {
	return (
		<div>
			<h1 className={[styles.title, styles.foo]}>Hello, World!</h1>
		</div>
	);
};

export default Demo;
