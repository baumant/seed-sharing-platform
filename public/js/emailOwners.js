// public/js/emailOwners.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("emailOwnersBtn");
  const emailOwnersSection = document.getElementById("emailOwnersSection");
  const selectedSeedsList = document.getElementById("selectedSeedsList");

  if (!btn || !emailOwnersSection || !selectedSeedsList) return;

  btn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(
      'input[name="selectedSeeds"]:checked'
    );
    if (!checkboxes.length) return;

    const userAddress = document.getElementById("userAddress").value;
    if (!userAddress) {
      alert("Please enter your address.");
      return;
    }

    // Group seeds by owner email
    const seedsByOwner = {};
    checkboxes.forEach((cb) => {
      const data = JSON.parse(cb.value);
      if (!seedsByOwner[data.email]) {
        seedsByOwner[data.email] = {
          owner: data.owner,
          seeds: [],
        };
      }
      seedsByOwner[data.email].seeds.push(`${data.type} - ${data.variety}`);
    });

    // Open separate emails
    Object.entries(seedsByOwner).forEach(([email, info]) => {
      const subject = encodeURIComponent("Seed Swap Inquiry");
      let body = `Hello ${info.owner},\n\nI'm interested in the following seeds:\n`;
      info.seeds.forEach((s) => (body += `• ${s}\n`));
      body += `\nPlease send the seeds to the following address:\n${userAddress}\n\nThank you!`;

      const mailtoLink = `mailto:${encodeURIComponent(
        email
      )}?subject=${subject}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, "_blank"); // may be blocked by pop-up blockers
    });
  });

  // Add event listeners for checkboxes
  const checkboxes = document.querySelectorAll('input[name="selectedSeeds"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectedSeeds);
  });
});

function updateSelectedSeeds() {
  const checkboxes = document.querySelectorAll(
    'input[name="selectedSeeds"]:checked'
  );
  const emailOwnersSection = document.getElementById("emailOwnersSection");
  const selectedSeedsList = document.getElementById("selectedSeedsList");

  if (!checkboxes.length) {
    emailOwnersSection.style.display = "none";
    return;
  }

  emailOwnersSection.style.display = "block";
  selectedSeedsList.innerHTML = "";

  checkboxes.forEach((cb) => {
    const data = JSON.parse(cb.value);
    const li = document.createElement("li");
    li.textContent = `${data.type} - ${data.variety}`;
    selectedSeedsList.appendChild(li);
  });
}
