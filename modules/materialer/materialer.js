"use strict";

const topicDefinitions = [
    { slug: "ai", title: "AI", icon: "🤖", text: "Materialer om kunstig intelligens" },
    { slug: "filhaandtering", title: "Filhåndtering", icon: "📂", text: "Filer, mapper og organisering" },
    { slug: "gdpr", title: "GDPR", icon: "🔐", text: "Persondata og sikker behandling" },
    { slug: "google-fotos", title: "Google Fotos", icon: "🖼️", text: "Billeder, deling og organisering" },
    { slug: "informationssoegning", title: "Informationssøgning", icon: "🔎", text: "Søgning og kildekritik" },
    { slug: "jobsogning", title: "Jobsøgning", icon: "💼", text: "Digitale værktøjer til jobsøgning" },
    { slug: "mail", title: "Mail", icon: "✉️", text: "Mail, mapper og god digital praksis" },
    { slug: "mobil", title: "Mobil", icon: "📱", text: "Smartphone, apps og indstillinger" },
    { slug: "ordbog", title: "Ordbog", icon: "📖", text: "Ord og begreber fra undervisningen" },
    { slug: "sikkerhed", title: "Sikkerhed", icon: "🛡️", text: "Adgangskoder, svindel og beskyttelse" },
    { slug: "tekstbehandling", title: "Tekstbehandling", icon: "📝", text: "Dokumenter, formatering og opsætning" },
    { slug: "virksomhedshold", title: "Virksomhedshold", icon: "🏭", text: "Materialer til virksomhedshold, herunder Cimbria" }
];

const elements = {
    grid: document.getElementById("topicGrid"),
    container: document.getElementById("materialsContainer"),
    results: document.getElementById("resultsSection"),
    title: document.getElementById("resultsTitle"),
    status: document.getElementById("materialStatus"),
    search: document.getElementById("materialSearch"),
    showAll: document.getElementById("showAllButton")
};

let allItems = [];
let activeSlug = null;

fetch("../../data/materialer.json")
    .then(response => {
        if (!response.ok) throw new Error("Materialelisten kunne ikke hentes");
        return response.json();
    })
    .then(data => {
        allItems = Array.isArray(data.items) ? data.items : [];
        renderTopicCards();
        elements.status.textContent = "Vælg et emne for at se materialerne";

        const requestedTopic = decodeURIComponent(location.hash.replace(/^#/, ""));
        if (requestedTopic && topicDefinitions.some(topic => topic.slug === requestedTopic)) {
            selectTopic(requestedTopic, false);
        }
    })
    .catch(() => {
        renderTopicCards();
        elements.status.textContent = "Materialelisten er ikke genereret endnu";
        showMessage("Der er endnu ingen genereret materialeliste. Kør GitHub Actions-workflowet efter næste push.");
    });

elements.search.addEventListener("input", handleSearch);
elements.showAll.addEventListener("click", () => {
    activeSlug = null;
    history.replaceState(null, "", location.pathname + location.search);
    updatePressedCards();
    elements.results.hidden = true;
    elements.search.value = "";
    elements.status.textContent = "Vælg et emne for at se materialerne";
    document.getElementById("topic-title").scrollIntoView({ behavior: "smooth", block: "start" });
});

function renderTopicCards() {
    elements.grid.replaceChildren();

    topicDefinitions.forEach(topic => {
        const folder = findTopFolder(topic.slug);
        const count = folder ? countFiles(folder.children || []) : 0;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "topic-card";
        button.dataset.slug = topic.slug;
        button.setAttribute("aria-pressed", String(activeSlug === topic.slug));

        const icon = document.createElement("span");
        icon.className = "topic-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = topic.icon;

        const heading = document.createElement("h3");
        heading.textContent = topic.title;

        const description = document.createElement("p");
        description.textContent = topic.text;

        const counter = document.createElement("span");
        counter.className = "topic-count";
        counter.textContent = count === 1 ? "1 fil" : `${count} filer`;

        button.append(icon, heading, description, counter);
        button.addEventListener("click", () => selectTopic(topic.slug, true));
        elements.grid.appendChild(button);
    });
}

function selectTopic(slug, updateHash) {
    const topic = topicDefinitions.find(item => item.slug === slug);
    if (!topic) return;

    activeSlug = slug;
    elements.search.value = "";
    elements.title.textContent = topic.title;
    elements.results.hidden = false;
    updatePressedCards();

    const folder = findTopFolder(slug);
    if (folder && Array.isArray(folder.children) && folder.children.length) {
        renderItems(folder.children);
        const count = countFiles(folder.children);
        elements.status.textContent = count === 1 ? "1 materiale" : `${count} materialer`;
    } else {
        showMessage(`Der er endnu ingen materialer under ${topic.title}.`);
        elements.status.textContent = "Ingen materialer endnu";
    }

    if (updateHash) history.replaceState(null, "", `#${slug}`);
    elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleSearch() {
    const query = elements.search.value.trim().toLocaleLowerCase("da-DK");

    if (!query) {
        if (activeSlug) selectTopic(activeSlug, false);
        else elements.results.hidden = true;
        return;
    }

    activeSlug = null;
    updatePressedCards();
    elements.results.hidden = false;
    elements.title.textContent = `Søgeresultater for “${elements.search.value.trim()}”`;

    const matches = filterItems(allItems, query);
    const count = countFiles(matches);
    elements.status.textContent = count === 1 ? "1 resultat" : `${count} resultater`;

    if (count) renderItems(matches);
    else showMessage("Ingen materialer matcher din søgning.");
}

function findTopFolder(slug) {
    return allItems.find(item => item.type === "folder" && normaliseSlug(item.name) === slug);
}

function normaliseSlug(value) {
    return String(value)
        .toLocaleLowerCase("da-DK")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/æ/g, "ae")
        .replace(/ø/g, "oe")
        .replace(/å/g, "aa")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function filterItems(items, query) {
    return items.flatMap(item => {
        if (item.type === "folder") {
            const children = filterItems(item.children || [], query);
            if (children.length || item.name.toLocaleLowerCase("da-DK").includes(query)) {
                return [{ ...item, children: children.length ? children : item.children || [] }];
            }
            return [];
        }
        return item.name.toLocaleLowerCase("da-DK").includes(query) ? [item] : [];
    });
}

function renderItems(items, target = elements.container) {
    if (target === elements.container) target.replaceChildren();

    items.forEach(item => {
        if (item.type === "folder") {
            const details = document.createElement("details");
            details.className = "material-folder";
            details.open = true;

            const summary = document.createElement("summary");
            summary.textContent = `📁 ${item.name}`;

            const content = document.createElement("div");
            content.className = "folder-content";
            renderItems(item.children || [], content);

            details.append(summary, content);
            target.appendChild(details);
            return;
        }

        const article = document.createElement("article");
        article.className = "material-file";

        const icon = document.createElement("span");
        icon.className = "file-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = fileIcon(item.extension);

        const info = document.createElement("div");
        info.className = "file-info";
        const name = document.createElement("strong");
        name.textContent = readableName(item.name);
        const meta = document.createElement("small");
        meta.textContent = `${String(item.extension || "fil").toUpperCase()} · ${formatBytes(Number(item.size) || 0)}`;
        info.append(name, meta);

        const link = document.createElement("a");
        link.className = "download-button";
        link.href = `../../${String(item.url || "").replace(/^\/+/, "")}`;
        link.download = "";
        link.textContent = "Download";
        link.setAttribute("aria-label", `Download ${item.name}`);

        article.append(icon, info, link);
        target.appendChild(article);
    });
}

function showMessage(text) {
    elements.results.hidden = false;
    elements.container.replaceChildren();
    const message = document.createElement("p");
    message.className = "message";
    message.textContent = text;
    elements.container.appendChild(message);
}

function updatePressedCards() {
    document.querySelectorAll(".topic-card").forEach(card => {
        card.setAttribute("aria-pressed", String(card.dataset.slug === activeSlug));
    });
}

function countFiles(items) {
    return items.reduce((total, item) => {
        return total + (item.type === "file" ? 1 : countFiles(item.children || []));
    }, 0);
}

function readableName(filename) {
    return String(filename)
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toLocaleString("da-DK", { maximumFractionDigits: 1 })} ${units[unit]}`;
}

function fileIcon(extension) {
    const icons = {
        pdf: "📕", doc: "📘", docx: "📘", xls: "📗", xlsx: "📗",
        ppt: "📙", pptx: "📙", zip: "🗜️", jpg: "🖼️", jpeg: "🖼️",
        png: "🖼️", webp: "🖼️", mp3: "🎧", mp4: "🎬"
    };
    return icons[String(extension).toLowerCase()] || "📄";
}
