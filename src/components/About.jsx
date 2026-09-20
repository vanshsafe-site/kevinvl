import faq from "../faq.json";

/** Crawlable, human-readable answers. The same data feeds the FAQ structured data in the page head. */
export default function About() {
  return (
    <section className="about" aria-labelledby="about-title">
      <h2 id="about-title" className="about-title">
        Good to know
      </h2>
      {faq.map((item) => (
        <details key={item.q} className="about-item">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </section>
  );
}
