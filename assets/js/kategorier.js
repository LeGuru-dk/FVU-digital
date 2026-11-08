"use strict";

/*
 * Fælles, automatisk kategorilogik.
 * Brug denne fil både på forsiden og på Materialer-siden, så navn, ikon
 * og beskrivelse altid er ens.
 */
(function () {
    const exact = {
        "ai": { title: "AI", icon: "🤖", text: "Materialer om kunstig intelligens" },
        "filhaandtering": { title: "Filhåndtering", icon: "📂", text: "Filer, mapper og organisering" },
        "gdpr": { title: "GDPR", icon: "🔐", text: "Persondata og sikker behandling" },
        "google-fotos": { title: "Google Fotos", icon: "🖼️", text: "Billeder, deling og organisering" },
        "icloud-fotos": { title: "iCloud Fotos", icon: "☁️", text: "Billeder, deling og organisering i iCloud" },
        "informationssoegning": { title: "Informationssøgning", icon: "🔎", text: "Søgning og kildekritik" },
        "jobsoegning": { title: "Jobsøgning", icon: "💼", text: "Digitale værktøjer til jobsøgning" },
        "jobsogning": { title: "Jobsøgning", icon: "💼", text: "Digitale værktøjer til jobsøgning" },
        "laer-din-computer-at-kende": { title: "Lær din computer at kende", icon: "💻", text: "Computerens dele, mus, tastatur, mapper og filer" },
        "mail": { title: "Mail", icon: "✉️", text: "Mail, mapper og god digital praksis" },
        "mobil": { title: "Mobil", icon: "📱", text: "Smartphone, apps og indstillinger" },
        "ordbog": { title: "Ordbog", icon: "📖", text: "Ord og begreber fra undervisningen" },
        "sikkerhed": { title: "Sikkerhed", icon: "🛡️", text: "Adgangskoder, svindel og beskyttelse" },
        "tekstbehandling": { title: "Tekstbehandling", icon: "📝", text: "Dokumenter, formatering og opsætning" },
        "virksomhedshold": { title: "Virksomhedshold", icon: "🏭", text: "Materialer til virksomhedshold" }
    };

    const rules = [
        { words: ["foto", "billede", "kamera"], icon: "🖼️", text: "Billeder, redigering og organisering" },
        { words: ["mobil", "telefon", "android", "iphone"], icon: "📱", text: "Mobiltelefon, apps og indstillinger" },
        { words: ["mail", "outlook", "gmail"], icon: "✉️", text: "Mail og digital kommunikation" },
        { words: ["sikker", "svindel", "kode", "mitid"], icon: "🛡️", text: "Digital sikkerhed og beskyttelse" },
        { words: ["fil", "mappe", "drev"], icon: "📂", text: "Filer, mapper og organisering" },
        { words: ["word", "tekst", "dokument"], icon: "📝", text: "Dokumenter og tekstbehandling" },
        { words: ["excel", "regneark", "tal"], icon: "📊", text: "Regneark, beregninger og data" },
        { words: ["powerpoint", "praesentation", "slides"], icon: "📽️", text: "Præsentationer og formidling" },
        { words: ["teams", "moede", "kalender"], icon: "📅", text: "Samarbejde, kalender og møder" },
        { words: ["soeg", "information", "kilde"], icon: "🔎", text: "Søgning, information og kildekritik" },
        { words: ["social", "facebook", "snapchat"], icon: "💬", text: "Sociale medier og digital adfærd" },
        { words: ["ai", "copilot", "kunstig-intelligens"], icon: "🤖", text: "Kunstig intelligens og digitale værktøjer" },
        { words: ["job", "cv", "ansoegning"], icon: "💼", text: "Jobsøgning og digitale jobværktøjer" },
        { words: ["ordbog", "begreb"], icon: "📖", text: "Ord og digitale begreber" },
        { words: ["virksomhed", "hold", "kursus"], icon: "🏭", text: "Materialer til undervisning og hold" }
    ];

    const fallbackIcons = ["📚", "🧭", "🧰", "💡", "🗂️", "⚙️", "🌐", "📌"];

    function normaliseSlug(value) {
        return String(value || "")
            .toLocaleLowerCase("da-DK")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/æ/g, "ae")
            .replace(/ø/g, "oe")
            .replace(/å/g, "aa")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }

    function readableTitle(name) {
        const clean = String(name || "")
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (!clean) return "Materialer";
        return clean
            .split(" ")
            .map(word => /^(ai|gdpr|pdf|it)$/i.test(word)
                ? word.toUpperCase()
                : word.charAt(0).toLocaleUpperCase("da-DK") + word.slice(1))
            .join(" ");
    }

    function stableIcon(slug) {
        let hash = 0;
        for (const char of slug) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
        return fallbackIcons[Math.abs(hash) % fallbackIcons.length];
    }

    function getCategory(folderName) {
        const slug = normaliseSlug(folderName);
        if (exact[slug]) return { slug, ...exact[slug] };

        const rule = rules.find(item => item.words.some(word => slug.includes(word)));
        return {
            slug,
            title: readableTitle(folderName),
            icon: rule ? rule.icon : stableIcon(slug),
            text: rule ? rule.text : `Materialer om ${readableTitle(folderName).toLocaleLowerCase("da-DK")}`
        };
    }

    function fromItems(items) {
        return (Array.isArray(items) ? items : [])
            .filter(item => item && item.type === "folder")
            .map(folder => ({ ...getCategory(folder.name), folder }))
            .sort((a, b) => a.title.localeCompare(b.title, "da-DK"));
    }

    window.FvuCategories = { getCategory, fromItems, normaliseSlug };
}());
