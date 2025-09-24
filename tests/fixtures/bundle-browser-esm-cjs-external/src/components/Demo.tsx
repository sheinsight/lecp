import styles from "./Demo.css";
import styles2 from "./Demo.less";

console.log("styles", styles2);

const Demo = () => {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Hello, World!</h1>
		</div>
	);
};

export default Demo;
