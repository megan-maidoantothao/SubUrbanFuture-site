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
    .then(({ rows: allRows }) => {
      // List only councils with a published story page.
      const rows = allRows.filter((row) => row.status === "published" && row.page_url);

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

        storyLink.href = (container.dataset.basePath || "") + lga.page_url;
        storyLink.classList.remove("disabled");
        storyLink.removeAttribute("aria-disabled");
        status.textContent = `Stories are available for ${lga.name}.`;
      });

      status.textContent = `${rows.length} councils with published stories.`;
    })
    .catch((error) => {
      select.innerHTML = '<option value="">LGA list unavailable</option>';
      status.textContent = "The council list could not be loaded.";
      disableLink();
      console.error(error);
    });
})();
