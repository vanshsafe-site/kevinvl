/** The K.E.V.I.N mark: a small lantern glow. `alive` makes it pulse gently while K.E.V.I.N is replying. */
export default function Lantern({ size = 28, alive = false, breathing = false, className = "" }) {
  return (
    <span
      className={`lantern ${alive ? "is-alive" : ""} ${breathing ? "is-breathing" : ""} ${className}`}
      style={{ "--size": `${size}px` }}
      aria-hidden="true"
    />
  );
}
