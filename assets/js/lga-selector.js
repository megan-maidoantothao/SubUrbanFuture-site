(() => {
  const container = document.querySelector("#lga-selector");
  if (!container) return;

  const select = container.querySelector("#lga-select");
  const status = container.querySelector("#lga-selection-status");
  const storyLink = container.querySelector("#lga-story-link");

  const disableLink = () => {
    storyLink.removeAttribute("href");
    storyLink.classList.add("disabled");
    storyLink.setAttribute("aria-disabled", "true");
  };

  const registryPromise = window.SUBURBAN_FUTURES_LGAS
    ? Promise.resolve(window.SUBURBAN_FUTURES_LGAS)
    : fetch(container.dataset.source).then((response) => {
        if (!response.ok) throw new Error(`LGA list returned ${response.status}`);
        return response.json();
      });

  registryPromise
    .then(({ rows }) => {
      select.innerHTML = '<option value="">Choose an LGA…</option>';

      rows.forEach((lga) => {
        const option = document.createElement("option");
        option.value = lga.id;
        option.textContent = lga.name;
        option.dataset.slug = lga.slug;
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        const lga = rows.find((row) => row.id === select.value);
        disableLink();

        if (!lga) {
          status.textContent = "";
          return;
        }

        const identifierNote = lga.lga_code
          ? `Official code: ${lga.lga_code}.`
          : "The current source has no official LGA code, so its generated slug is used internally.";

        if (lga.page_url) {
          storyLink.href = (container.dataset.basePath || "") + lga.page_url;
          storyLink.classList.remove("disabled");
          storyLink.removeAttribute("aria-disabled");
          status.textContent =
            lga.status === "published"
              ? `${identifierNote} Published stories are available.`
              : `${identifierNote} This LGA page is available, but its public claims still require validation.`;
        } else {
          status.textContent =
            `${identifierNote} Data is available, but no validated story page has been published yet.`;
        }
      });

      status.textContent = `${rows.length} LGAs loaded from the current dataset.`;
    })
    .catch((error) => {
      select.innerHTML = '<option value="">LGA list unavailable</option>';
      status.textContent =
        "The dynamic list could not load. Use the CSV download below.";
      disableLink();
      console.error(error);
    });
})();
