(() => {
  const container = document.querySelector("#lga-scatter");
  if (!container || typeof d3 === "undefined") return;

  const source = container.dataset.source;
  const tooltip = d3.select("#lga-scatter-tooltip");
  const colours = {
    "Established areas": "#2a78d6",
    "Growth corridors": "#eb6834",
    "Mixed areas": "#1baf7a"
  };

  const dataPromise = window.SUBURBAN_FUTURES_POPULATION_FACILITIES
    ? Promise.resolve(window.SUBURBAN_FUTURES_POPULATION_FACILITIES)
    : d3.json(source);

  dataPromise.then(({ metadata, rows }) => {
    const fallback = container.querySelector(".static-fallback");
    rows.forEach((d) => {
      d.recent_growth_21_24 = +d.recent_growth_21_24;
      d.facilities_per_1000_2024 = +d.facilities_per_1000_2024;
      d.population_2024 = +d.population_2024;
    });

    const controls = d3.create("div").attr("class", "mb-3");
    controls.append("label")
      .attr("for", "settlement-filter")
      .attr("class", "me-2")
      .text("Settlement context:");
    const select = controls.append("select")
      .attr("id", "settlement-filter")
      .attr("class", "form-select form-select-sm d-inline-block w-auto");
    select.selectAll("option")
      .data(["All areas", ...Object.keys(colours)])
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d);
    container.prepend(controls.node());

    const width = 900;
    const height = 560;
    const margin = { top: 30, right: 45, bottom: 70, left: 75 };
    const x = d3.scaleLinear()
      .domain(d3.extent(rows, (d) => d.recent_growth_21_24))
      .nice()
      .range([margin.left, width - margin.right]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(rows, (d) => d.facilities_per_1000_2024) * 1.08])
      .nice()
      .range([height - margin.bottom, margin.top]);
    const radius = d3.scaleSqrt()
      .domain(d3.extent(rows, (d) => d.population_2024))
      .range([5, 15]);

    const svg = d3.create("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `Interactive scatter plot of ${metadata.council} SA2 population growth and mapped facilities.`);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format(".0%")));
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 18)
      .attr("text-anchor", "middle")
      .text("Population growth, 2021–2024");
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text("Mapped facilities per 1,000 residents (2024)");

    [
      { value: metadata.council_rate, dash: "7 5", label: metadata.council },
      { value: metadata.melbourne_rate, dash: "2 5", label: "Greater Melbourne" }
    ].filter((benchmark) => Number.isFinite(benchmark.value)).forEach((benchmark, index) => {
      svg.append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(benchmark.value))
        .attr("y2", y(benchmark.value))
        .attr("stroke", "#4f5962")
        .attr("stroke-dasharray", benchmark.dash);
      svg.append("text")
        .attr("x", width - margin.right)
        .attr("y", y(benchmark.value) - 6 - index * 13)
        .attr("text-anchor", "end")
        .attr("font-size", 12)
        .text(`${benchmark.label}: ${benchmark.value.toFixed(2)}`);
    });

    const showTooltip = (event, d) => {
      const point = event.currentTarget.getBoundingClientRect();
      const left = event.pageX || point.left + window.scrollX + point.width;
      const top = event.pageY || point.top + window.scrollY;
      tooltip
        .style("opacity", 1)
        .style("left", `${left + 12}px`)
        .style("top", `${top + 12}px`)
        .html(
          `<strong>${d.suburb}</strong><br>` +
          `${d.settlement_context}<br>` +
          `Growth: ${d3.format(".1%")(d.recent_growth_21_24)}<br>` +
          `Facilities: ${d.facilities_per_1000_2024.toFixed(2)} per 1,000<br>` +
          `Population: ${d3.format(",")(d.population_2024)}`
        );
    };

    const points = svg.append("g")
      .selectAll("circle")
      .data(rows)
      .join("circle")
      .attr("cx", (d) => x(d.recent_growth_21_24))
      .attr("cy", (d) => y(d.facilities_per_1000_2024))
      .attr("r", (d) => radius(d.population_2024))
      .attr("fill", (d) => colours[d.settlement_context] || "#777")
      .attr("fill-opacity", 0.82)
      .attr("stroke", "white")
      .attr("stroke-width", 1.2)
      .attr("tabindex", 0)
      .attr("aria-label", (d) =>
        `${d.suburb}: ${d3.format(".1%")(d.recent_growth_21_24)} growth and ` +
        `${d.facilities_per_1000_2024.toFixed(2)} facilities per 1,000`
      )
      .on("pointermove", showTooltip)
      .on("pointerleave", () => tooltip.style("opacity", 0))
      .on("focus", (event, d) => showTooltip(event, d))
      .on("blur", () => tooltip.style("opacity", 0));

    select.on("change", (event) => {
      const selected = event.target.value;
      points
        .transition()
        .duration(250)
        .attr("opacity", (d) =>
          selected === "All areas" || d.settlement_context === selected ? 1 : 0.08
        );
    });

    if (fallback) fallback.remove();
    container.append(svg.node());
  }).catch((error) => {
    container.insertAdjacentHTML(
      "afterbegin",
      "<p>The interactive chart could not load; the static version is shown.</p>"
    );
    console.error(error);
  });
})();
