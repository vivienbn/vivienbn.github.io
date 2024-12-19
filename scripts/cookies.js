export function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Durée en jours
    const expires = "expires=" + date.toUTCString();
    // Convertir en chaîne si ce n'est pas une chaîne
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    document.cookie = `${name}=${stringValue}; ${expires}; path=/`;
}

export function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null; // Retourne null si le cookie n'existe pas
}

export function getOrCreateCookie(name, defaultValue, days) {
    let value = getCookie(name);
    if (!value) {
        // Si le cookie n'existe pas, on le crée
        setCookie(name, defaultValue, days);
        value = defaultValue;
    } else {
        try {
            // Essayer de parser JSON si possible
            value = JSON.parse(value);
        } catch (e) {
            // Si ce n'est pas un JSON valide, garder tel quel
        }
    }
    return value;
}